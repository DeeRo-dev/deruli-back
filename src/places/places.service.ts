import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Place } from './place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place)
    private placesRepository: Repository<Place>,
  ) {}

  async create(userId: number, dto: CreatePlaceDto): Promise<Place> {
    const place = this.placesRepository.create({
      name: dto.name.trim(),
      address: dto.address.trim(),
      instagram: dto.instagram?.trim() ?? null,
      photoUrl: dto.photoUrl ?? null,
      createdById: userId,
    });

    return this.placesRepository.save(place);
  }

  /** Los lugares son públicos: cualquiera puede buscarlos y reseñarlos. */
  async findAll(search?: string): Promise<Place[]> {
    return this.placesRepository.find({
      where: search ? { name: ILike(`%${search}%`) } : {},
      order: { name: 'ASC' },
      take: 50,
    });
  }

  async findOne(id: number): Promise<Place> {
    const place = await this.placesRepository.findOne({ where: { id } });

    if (!place) {
      throw new NotFoundException(`Lugar con ID ${id} no encontrado`);
    }

    return place;
  }
}
