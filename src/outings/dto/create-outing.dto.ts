import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateOutingDto {
  @IsInt({ message: 'placeId debe ser un número entero' })
  @IsPositive({ message: 'placeId inválido' })
  placeId: number;

  /** ISO 8601, ej. "2026-10-24T20:30:00". */
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  dateTime: string;

  @IsOptional()
  @IsBoolean()
  booked?: boolean;

  /** En CENTAVOS. Entero, nunca float. */
  @IsOptional()
  @IsInt({ message: 'El gasto debe ser un entero en centavos' })
  @Min(0, { message: 'El gasto no puede ser negativo' })
  totalSpend?: number;

  /**
   * Miembros de la mesa que participan. El creador se agrega siempre,
   * mande o no su propio id.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50, { message: 'Demasiados comensales' })
  @IsInt({ each: true, message: 'Los ids de comensales deben ser enteros' })
  guestIds?: number[];

  /**
   * 'confirmed' — están en el lugar ahora: entran como 'going'.
   * 'invited'   — salida agendada: entran como 'invited' y tienen que
   *               aceptar. La notificación push queda para más adelante.
   */
  @IsOptional()
  @IsIn(['confirmed', 'invited'], {
    message: "attendance debe ser 'confirmed' o 'invited'",
  })
  attendance?: 'confirmed' | 'invited';
}
