import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_IMAGE_BYTES } from './storage.service';

/** Nombre del campo del multipart. Igual en todos los endpoints. */
export const IMAGE_FIELD = 'file';

/**
 * Recibe una imagen por multipart en el campo `file`.
 *
 * `memoryStorage`: el archivo va a Supabase, no al disco del servidor.
 * Escribirlo en disco solo para volver a leerlo agrega un punto de fallo
 * (y en un hosting efímero, basura que nadie limpia).
 *
 * El límite de Multer corta la subida en el borde, antes de llenar la
 * memoria. `StorageService.validate` igual revisa tamaño y MIME: este
 * límite protege al servidor, esa validación protege los datos.
 */
export function UploadImage() {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(IMAGE_FIELD, {
        storage: memoryStorage(),
        limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
      }),
    ),
  );
}
