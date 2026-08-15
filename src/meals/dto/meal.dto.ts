import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMealDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres' })
  name: string;

  /** En CENTAVOS. Entero, nunca float. */
  @IsOptional()
  @IsInt({ message: 'El precio debe ser un entero en centavos' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price?: number;
}

export class RateMealDto {
  @IsInt({ message: 'Los derulis deben ser un entero' })
  @Min(1, { message: 'El mínimo es 1 derulis' })
  @Max(5, { message: 'El máximo es 5 derulis' })
  derulis: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'El comentario no puede superar los 1000 caracteres',
  })
  comment?: string;
}
