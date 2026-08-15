import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePlaceDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres' })
  name: string;

  @IsString()
  @MinLength(3, { message: 'La dirección debe tener al menos 3 caracteres' })
  @MaxLength(200, {
    message: 'La dirección no puede superar los 200 caracteres',
  })
  address: string;

  /** Se guarda sin arroba: el front la agrega al mostrar. */
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'El usuario de Instagram es demasiado largo' })
  @Matches(/^[A-Za-z0-9._]+$/, {
    message: 'El usuario de Instagram solo admite letras, números, punto y _',
  })
  instagram?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La foto debe ser una URL válida' })
  photoUrl?: string;
}
