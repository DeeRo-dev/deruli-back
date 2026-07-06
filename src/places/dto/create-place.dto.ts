import { 
  IsString, 
  IsUrl, 
  IsOptional, 
  IsArray, 
  IsNotEmpty,
  Length 
} from 'class-validator';

export class CreatePlaceDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Length(2, 255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'La provincia es obligatoria' })
  province: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  address: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsUrl({}, { message: 'URL de imagen inválida' })
  @IsOptional()
  imageUrl?: string;

  @IsUrl({}, { message: 'URL de website inválida' })
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  cuisineType?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
