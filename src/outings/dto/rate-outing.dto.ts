import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RateOutingDto {
  @IsInt({ message: 'Los derulis del lugar deben ser un entero' })
  @Min(1, { message: 'El mínimo es 1 derulis' })
  @Max(5, { message: 'El máximo es 5 derulis' })
  placeDerulis: number;

  @IsInt({ message: 'Los derulis de la atención deben ser un entero' })
  @Min(1, { message: 'El mínimo es 1 derulis' })
  @Max(5, { message: 'El máximo es 5 derulis' })
  serviceDerulis: number;

  /** Relación precio-calidad. Opcional por las reseñas viejas. */
  @IsOptional()
  @IsInt({ message: 'Los derulis del valor deben ser un entero' })
  @Min(1, { message: 'El mínimo es 1 derulis' })
  @Max(5, { message: 'El máximo es 5 derulis' })
  valueDerulis?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'El comentario no puede superar los 1000 caracteres',
  })
  comment?: string;
}
