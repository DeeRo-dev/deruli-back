import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './image.entity';
import { StorageService } from './storage.service';
import type { UploadedFile } from './storage.service';
import type { ImageResource } from './image-resource';

/**
 * La imagen tal como la ve el cliente. La entidad tiene más cosas
 * (uploadedById, mimeType) que no aportan nada al front.
 */
export interface ImageView {
  id: number;
  url: string;
  storagePath: string;
  createdAt: Date;
}

function toView(image: Image): ImageView {
  return {
    id: image.id,
    url: image.url,
    storagePath: image.storagePath,
    createdAt: image.createdAt,
  };
}

/**
 * Sube, lista y borra imágenes de cualquier recurso.
 *
 * Es el único lugar que toca las dos mitades a la vez —el archivo en
 * Supabase y la fila en Postgres— para que no puedan quedar desparejas.
 * Los módulos de dominio (users, places, meals, tables) validan permisos y
 * delegan acá; no saben que existe Supabase.
 */
@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly imagesRepository: Repository<Image>,
    private readonly storage: StorageService,
  ) {}

  async add(params: {
    resource: ImageResource;
    resourceId: number;
    file: UploadedFile | undefined;
    userId: number;
  }): Promise<ImageView> {
    const { resource, resourceId, file, userId } = params;

    const stored = await this.storage.upload({ resource, resourceId, file });

    try {
      const image = await this.imagesRepository.save(
        this.imagesRepository.create({
          resource,
          resourceId,
          storagePath: stored.storagePath,
          url: stored.url,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          uploadedById: userId,
        }),
      );

      return toView(image);
    } catch (error) {
      /* Si la fila no se pudo guardar, el archivo ya subido no le sirve a
         nadie: se borra para no dejar basura paga en el bucket. */
      await this.storage.delete(stored.storagePath);
      throw error;
    }
  }

  async listFor(
    resource: ImageResource,
    resourceId: number,
  ): Promise<ImageView[]> {
    const images = await this.imagesRepository.find({
      where: { resource, resourceId },
      order: { createdAt: 'ASC' },
    });

    return images.map(toView);
  }

  /** La imagen, verificando que sea de ese recurso y no de otro. */
  async findOwned(
    resource: ImageResource,
    resourceId: number,
    imageId: number,
  ): Promise<Image> {
    const image = await this.imagesRepository.findOne({
      where: { id: imageId, resource, resourceId },
    });

    if (!image) {
      throw new NotFoundException(`Imagen con ID ${imageId} no encontrada`);
    }

    return image;
  }

  /** Borra archivo y fila. El archivo primero: un huérfano en la base sería peor. */
  async remove(image: Image): Promise<void> {
    await this.storage.delete(image.storagePath);
    await this.imagesRepository.delete({ id: image.id });
  }

  /**
   * Borra todas las imágenes de un recurso. Es lo que hay que llamar antes
   * de borrar el recurso: Postgres no puede arrastrar los archivos de
   * Supabase con un CASCADE.
   */
  async deleteAllFor(
    resource: ImageResource,
    resourceId: number,
  ): Promise<void> {
    const images = await this.imagesRepository.find({
      where: { resource, resourceId },
    });

    for (const image of images) {
      await this.storage.delete(image.storagePath);
    }

    if (images.length > 0) {
      await this.imagesRepository.delete({ resource, resourceId });
    }
  }

  /**
   * Para los recursos de imagen única (avatar, foto de mesa): reemplaza la
   * que hubiera. Devuelve la nueva.
   */
  async replaceSingle(params: {
    resource: ImageResource;
    resourceId: number;
    file: UploadedFile | undefined;
    userId: number;
  }): Promise<ImageView> {
    const previous = await this.imagesRepository.find({
      where: { resource: params.resource, resourceId: params.resourceId },
    });

    const image = await this.add(params);

    /* Recién después de que la nueva quedó guardada: si se borrara antes y
       la subida fallara, el usuario se quedaría sin ninguna. */
    for (const old of previous) {
      await this.remove(old);
    }

    return image;
  }
}
