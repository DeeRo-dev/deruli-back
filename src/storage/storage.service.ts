import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { IMAGE_RESOURCES } from './image-resource';
import type { ImageResource } from './image-resource';

/** Un archivo subido por multipart. Es lo que deja Multer en la request. */
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredFile {
  storagePath: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Bucket por defecto. Se puede pisar con SUPABASE_BUCKET para que
 * desarrollo y producción no escriban en el mismo lugar: los ids de los
 * recursos salen de cada base, así que `places/12/` significa un lugar
 * distinto en cada entorno y las fotos se pisarían entre sí.
 */
export const DEFAULT_IMAGE_BUCKET = 'app-images';

/** Extensión por MIME. La del archivo del cliente no se usa nunca. */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const ALLOWED_IMAGE_MIME_TYPES = Object.keys(EXTENSION_BY_MIME);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Todo lo que sabe de Supabase Storage vive acá. El resto de la app pide
 * "guardá este archivo para este recurso" y recibe un path y una URL.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: SupabaseClient | null = null;
  private bucket = DEFAULT_IMAGE_BUCKET;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      /* No se tumba el arranque: el resto de la app funciona sin imágenes,
         y en un entorno sin storage configurado (tests, CI) obligar a
         tener credenciales de Supabase sería peor. Los endpoints de
         imágenes responden 500 con un mensaje claro. */
      this.logger.warn(
        'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY: la subida de ' +
          'imágenes queda deshabilitada.',
      );
      return;
    }

    this.bucket =
      this.config.get<string>('SUPABASE_BUCKET')?.trim() ||
      DEFAULT_IMAGE_BUCKET;

    /* La service role key saltea las políticas RLS del bucket. Por eso vive
       solo acá, en el backend, y nunca viaja al front. */
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    this.logger.log(`Imágenes: bucket "${this.bucket}"`);
  }

  private get storage() {
    if (!this.client) {
      throw new InternalServerErrorException(
        'El almacenamiento de imágenes no está configurado en el servidor',
      );
    }
    return this.client.storage.from(this.bucket);
  }

  /**
   * Valida tipo y tamaño y devuelve el archivo ya tipado.
   *
   * Devuelve en vez de ser una assertion function porque TypeScript no
   * acepta `asserts` en un método llamado a través de una propiedad
   * (`this.storage.validate(...)`), y la alternativa serían casts en cada
   * controlador — justo lo que hay que evitar con datos del cliente.
   */
  ensureValid(file: UploadedFile | undefined): UploadedFile {
    if (!file) {
      throw new BadRequestException('No llegó ningún archivo');
    }

    if (!EXTENSION_BY_MIME[file.mimetype]) {
      throw new BadRequestException(
        `Formato no admitido. Se aceptan: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('La imagen no puede superar los 5 MB');
    }

    if (file.size === 0) {
      throw new BadRequestException('El archivo está vacío');
    }

    return file;
  }

  /**
   * Sube el archivo y devuelve dónde quedó.
   *
   * El nombre lo genera el servidor (UUID + extensión derivada del MIME):
   * el filename del cliente no se usa ni para el path ni para la extensión,
   * así no hay forma de escaparse del directorio del recurso.
   */
  async upload(params: {
    resource: ImageResource;
    resourceId: number;
    file: UploadedFile | undefined;
  }): Promise<StoredFile> {
    const { resource, resourceId } = params;
    const file = this.ensureValid(params.file);

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      throw new BadRequestException('Recurso inválido');
    }

    const extension = EXTENSION_BY_MIME[file.mimetype];
    const storagePath = `${IMAGE_RESOURCES[resource].prefix}/${resourceId}/${randomUUID()}.${extension}`;

    const { error } = await this.storage.upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      // El path lleva un UUID: si ya existe, algo está muy mal.
      upsert: false,
    });

    if (error) {
      this.logger.error(`Falló la subida de ${storagePath}: ${error.message}`);
      throw new InternalServerErrorException('No pudimos guardar la imagen');
    }

    return {
      storagePath,
      url: this.getPublicUrl(storagePath),
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  /**
   * Borra el archivo. No falla si ya no está: el objetivo es que deje de
   * existir, y que alguien lo haya borrado antes no es un error para quien
   * pidió borrarlo.
   */
  async delete(storagePath: string): Promise<void> {
    const { error } = await this.storage.remove([storagePath]);

    if (error) {
      /* Se registra pero no se propaga: si el archivo quedó en Supabase y
         la fila se borra igual, la app queda consistente y el huérfano se
         limpia después. Al revés —fila viva, archivo muerto— sería peor. */
      this.logger.warn(`No se pudo borrar ${storagePath}: ${error.message}`);
    }
  }

  getPublicUrl(storagePath: string): string {
    const { data } = this.storage.getPublicUrl(storagePath);
    return data.publicUrl;
  }
}
