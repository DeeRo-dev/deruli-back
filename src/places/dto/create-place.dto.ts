import {
  IsLatitude,
  IsLongitude,
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

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  description?: string;

  /* Formato laxo a propósito: acepta +54 9 11 1234-5678, (011) 4321 y lo
     que use cada país. Solo se rechaza lo que no puede ser un teléfono. */
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'El teléfono no puede superar los 30 caracteres' })
  @Matches(/^[0-9+()\-.\s]{6,30}$/, {
    message: 'El teléfono solo admite números, espacios y + ( ) - .',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'La ciudad no puede superar los 120 caracteres' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, {
    message: 'La provincia no puede superar los 120 caracteres',
  })
  province?: string;

  /* Obligatorias: sin punto el lugar no se puede señalar en el mapa, y
     geocodificar la dirección escrita a mano erra por kilómetros. Lo marca
     quien está ahí. */
  @IsLatitude({ message: 'Marcá la ubicación en el mapa' })
  latitude: number;

  @IsLongitude({ message: 'Marcá la ubicación en el mapa' })
  longitude: number;

  /** Si no viene, queda Argentina. */
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'El país no puede superar los 120 caracteres' })
  country?: string;

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
