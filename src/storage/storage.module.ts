import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './image.entity';
import { ImagesService } from './images.service';
import { StorageService } from './storage.service';

/**
 * Global: las imágenes las necesita casi cualquier módulo de dominio, y
 * repetir el import en todos solo agrega ruido. Es la excepción, no la
 * regla, y se justifica porque no tiene estado propio ni dependencias
 * hacia el dominio — solo hacia Supabase y su propia tabla.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Image])],
  providers: [StorageService, ImagesService],
  exports: [StorageService, ImagesService],
})
export class StorageModule {}
