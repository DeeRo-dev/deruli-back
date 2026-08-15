import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import type { OutingStatus } from '../outing.entity';

const STATUSES: OutingStatus[] = ['planned', 'done', 'cancelled'];

export class UpdateOutingDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  dateTime?: string;

  @IsOptional()
  @IsBoolean()
  booked?: boolean;

  /** En CENTAVOS. Entero, nunca float. */
  @IsOptional()
  @IsInt({ message: 'El gasto debe ser un entero en centavos' })
  @Min(0, { message: 'El gasto no puede ser negativo' })
  totalSpend?: number;

  @IsOptional()
  @IsIn(STATUSES, {
    message: `El estado debe ser uno de: ${STATUSES.join(', ')}`,
  })
  status?: OutingStatus;
}
