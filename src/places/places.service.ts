import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { SearchPlacesDto } from './dto/search-places.dto';
import { PLACE_STATS_CTE, buildPlaceWhere } from './places.search';

export interface PlaceRow {
  id: number;
  name: string;
  address: string;
  city: string | null;
  province: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  instagram: string | null;
  photoUrl: string | null;
  derulis: number | null;
  visitCount: number;
}

export interface PagedPlaces {
  items: PlaceRow[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

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
      city: dto.city?.trim() || null,
      province: dto.province?.trim() || null,
      country: dto.country?.trim() || 'Argentina',
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      photoUrl: dto.photoUrl ?? null,
      createdById: userId,
    });

    return this.placesRepository.save(place);
  }

  /**
   * Los lugares son públicos: cualquiera puede buscarlos y reseñarlos.
   * Pagina y ordena en la base, con el promedio calculado en SQL.
   */
  async search(dto: SearchPlacesDto): Promise<PagedPlaces> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 4;
    const offset = (page - 1) * limit;
    const onlyRated = dto.sort === 'top';

    const filters = {
      search: dto.search?.trim() || undefined,
      city: dto.city?.trim() || undefined,
      province: dto.province?.trim() || undefined,
      country: dto.country?.trim() || undefined,
      onlyRated,
    };

    const where = buildPlaceWhere(filters);

    const order = onlyRated
      ? 'ORDER BY ps.derulis DESC, ps.visit_count DESC, p.name ASC'
      : 'ORDER BY p.name ASC';

    const rows = await this.placesRepository.manager.query<PlaceRow[]>(
      `${PLACE_STATS_CTE}
       SELECT p.id, p.name, p.address, p.city, p.province, p.country,
              p.latitude, p.longitude, p.instagram, p."photoUrl",
              ps.derulis, COALESCE(ps.visit_count, 0) AS "visitCount"
         FROM places p
         LEFT JOIN place_stats ps ON ps.place_id = p.id
         ${where.sql}
         ${order}
        LIMIT $${where.params.length + 1} OFFSET $${where.params.length + 2}`,
      [...where.params, limit, offset],
    );

    const totalRows = await this.placesRepository.manager.query<
      { total: string }[]
    >(
      `${PLACE_STATS_CTE}
       SELECT COUNT(*)::int AS total
         FROM places p
         LEFT JOIN place_stats ps ON ps.place_id = p.id
         ${where.sql}`,
      where.params,
    );

    const total = Number(totalRows[0]?.total ?? 0);

    return {
      // Postgres devuelve numeric como string: se normaliza acá.
      items: rows.map((row) => ({
        ...row,
        derulis:
          row.derulis === null
            ? null
            : Math.round(Number(row.derulis) * 100) / 100,
        // numeric llega como string desde la query cruda.
        latitude: row.latitude === null ? null : Number(row.latitude),
        longitude: row.longitude === null ? null : Number(row.longitude),
        visitCount: Number(row.visitCount),
      })),
      page,
      limit,
      total,
      hasMore: offset + rows.length < total,
    };
  }

  async findOne(id: number): Promise<Place> {
    const place = await this.placesRepository.findOne({ where: { id } });

    if (!place) {
      throw new NotFoundException(`Lugar con ID ${id} no encontrado`);
    }

    return place;
  }
}
