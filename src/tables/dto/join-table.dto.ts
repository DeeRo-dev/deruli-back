import { IsString, Length } from 'class-validator';

export class JoinTableDto {
  @IsString()
  @Length(6, 12, { message: 'El código de invitación no es válido' })
  code: string;
}
