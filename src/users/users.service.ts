import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { ImagesService } from '../storage/images.service';
import type { ImageView } from '../storage/images.service';
import type { UploadedFile } from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly images: ImagesService,
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        isActive: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        isActive: true,
      },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  async getProfile(id: number): Promise<Partial<User>> {
    const user = await this.findOne(id);
    const { password, ...profile } = user;
    return profile;
  }

  /**
   * Reemplaza el avatar. `replaceSingle` borra el anterior de Supabase
   * recién cuando el nuevo quedó guardado, así nadie se queda sin foto por
   * una subida fallida.
   */
  async setAvatar(
    userId: number,
    file: UploadedFile | undefined,
  ): Promise<{ avatar: string; image: ImageView }> {
    // Confirma que el usuario existe antes de subir nada.
    await this.findOne(userId);

    const image = await this.images.replaceSingle({
      resource: 'avatars',
      resourceId: userId,
      file,
      userId,
    });

    /* `User.avatar` se mantiene actualizado además de la fila en `images`:
       es la URL que ya consumen el perfil y los avatares de las mesas, y
       resolverla ahí evita un join en cada listado. */
    await this.usersRepository.update(userId, { avatar: image.url });

    return { avatar: image.url, image };
  }

  /** Saca el avatar: borra el archivo y deja el perfil sin foto. */
  async removeAvatar(userId: number): Promise<void> {
    await this.findOne(userId);
    await this.images.deleteAllFor('avatars', userId);
    await this.usersRepository.update(userId, { avatar: null });
  }
}
