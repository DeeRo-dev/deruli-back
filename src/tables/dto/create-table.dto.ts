import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Espeja createTableSchema del front (features/tables/lib/schemas.ts). */
export class CreateTableDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(60, { message: 'El nombre no puede superar los 60 caracteres' })
  name: string;

  // Opcional a propósito: obligar a describir la mesa agrega fricción al
  // paso que más queremos que la gente complete.
  @IsOptional()
  @IsString()
  @MaxLength(280, {
    message: 'La descripción no puede superar los 280 caracteres',
  })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
