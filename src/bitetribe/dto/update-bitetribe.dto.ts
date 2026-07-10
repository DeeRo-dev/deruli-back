import { PartialType } from '@nestjs/swagger';
import { CreateBitetribeDto } from './create-bitetribe.dto';

export class UpdateBitetribeDto extends PartialType(CreateBitetribeDto) {}
