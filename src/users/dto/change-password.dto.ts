import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  /* Se pide la actual aunque el token ya identifique al usuario: un
     teléfono desbloqueado y prestado no debería alcanzar para quedarse con
     la cuenta. */
  @IsString()
  @MinLength(1, { message: 'Ingresá tu contraseña actual' })
  currentPassword: string;

  @IsString()
  @MinLength(6, {
    message: 'La contraseña nueva debe tener al menos 6 caracteres',
  })
  newPassword: string;
}
