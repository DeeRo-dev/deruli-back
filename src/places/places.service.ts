// src/modules/places/places.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlaceDto } from './dto/create-place.dto'; // ✅
import { UpdatePlaceDto } from './dto/update-place.dto'; // ✅
import { Place } from 'src/places/entities/place.entity';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
  ) {}

  async create(createPlaceDto: CreatePlaceDto, userId: number): Promise<Place> {
    const place = this.placeRepository.create({
      ...createPlaceDto,
      createdById: userId,
    });

    return this.placeRepository.save(place);
  }

  async findAll(): Promise<Place[]> {
    return this.placeRepository.find({
      where: { isActive: true },
      relations: { createdBy: true },
      select: {
        id: true,
        name: true,
        description: true,
        province: true,
        city: true,
        neighborhood: true,
        address: true,
        imageUrl: true,
        tags: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          id: true,
          name: true,
        },
      },
    });
  }

  async findOne(id: number): Promise<Place> {
    const place = await this.placeRepository.findOne({
      where: { id, isActive: true },
      relations: { createdBy: true },
    });

    if (!place) {
      throw new NotFoundException(`Lugar con ID ${id} no encontrado`);
    }

    return place;
  }

  async update(id: number, updatePlaceDto: UpdatePlaceDto): Promise<Place> {
    const place = await this.findOne(id);

    const updatedPlace = this.placeRepository.merge(place, updatePlaceDto);
    return this.placeRepository.save(updatedPlace);
  }

  async remove(id: number): Promise<void> {
    const place = await this.findOne(id);

    place.isActive = false;
    await this.placeRepository.save(place);
  }

  async search(filters: {
    search?: string;
    province?: string;
    city?: string;
    cuisineType?: string;
  }): Promise<Place[]> {
    const query = this.placeRepository
      .createQueryBuilder('place')
      .where('place.isActive = :isActive', { isActive: true });

    if (filters.search) {
      query.andWhere(
        '(place.name ILIKE :search OR place.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.province) {
      query.andWhere('place.province = :province', {
        province: filters.province,
      });
    }

    if (filters.city) {
      query.andWhere('place.city = :city', { city: filters.city });
    }

    if (filters.cuisineType) {
      query.andWhere('place.cuisineType = :cuisineType', {
        cuisineType: filters.cuisineType,
      });
    }

    return query.getMany();
  }
}
