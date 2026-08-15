import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchPlacesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  /** 'top' = mejor puntuados primero (solo los que ya tienen reseñas). */
  @IsOptional()
  @IsIn(['top', 'name'], { message: "sort debe ser 'top' o 'name'" })
  sort?: 'top' | 'name';

  // Los query params llegan como string: Type los convierte a número.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50, { message: 'El máximo es 50 por página' })
  limit?: number;
}
