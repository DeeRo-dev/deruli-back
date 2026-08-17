import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { SearchPlacesDto } from './dto/search-places.dto';
import { GeocodingService } from './geocoding.service';
import { ImagesService } from '../storage/images.service';
import type { ImageView } from '../storage/images.service';
import type { UploadedFile } from '../storage/storage.service';
import {
  PLACE_STATS_CTE,
  PLACE_COMMENT_CTE,
  buildPlaceWhere,
} from './places.search';

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
  /** Un comentario cualquiera de los que dejó la comunidad. */
  comment: string | null;
}

/**
 * Dos lugares con el mismo nombre a menos de esto son el mismo. 150 m
 * tolera que uno marque el punto en la vereda de enfrente sin llegar a
 * juntar dos sucursales distintas del mismo barrio.
 */
const DUPLICATE_RADIUS_M = 150;

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
    private readonly geocoding: GeocodingService,
    private readonly images: ImagesService,
  ) {}

  /**
   * Completa las coordenadas del lugar a partir de su dirección.
   *
   * Idempotente y barato de llamar: si ya tiene punto, o si ya se intentó
   * y no se pudo resolver, devuelve el lugar sin tocar el geocoder. Así el
   * front puede pedirlo cada vez que abre un lugar sin punto.
   */
  async locate(id: number): Promise<Place> {
    const place = await this.placesRepository.findOne({ where: { id } });
    if (!place) throw new NotFoundException('Lugar no encontrado');

    const located = place.latitude !== null && place.longitude !== null;
    if (located || place.geocodedAt !== null) return place;

    const coordinates = await this.geocoding.geocode({
      address: place.address,
      city: place.city,
      province: place.province,
      country: place.country,
    });

    place.geocodedAt = new Date();
    if (coordinates) {
      place.latitude = coordinates.latitude;
      place.longitude = coordinates.longitude;
    }

    return this.placesRepository.save(place);
  }

  /**
   * Solo puede aportar fotos de un lugar quien estuvo: hace falta haber
   * sido comensal ('going') de una salida terminada ahí.
   *
   * Es el mismo criterio que para puntuar (`OutingsService.assertGuest`):
   * los lugares son públicos para leer, pero lo que se les agrega sale de
   * quien fue.
   */
  private async assertVisited(placeId: number, userId: number): Promise<void> {
    const rows = await this.placesRepository.manager.query<{ id: number }[]>(
      `SELECT o.id
         FROM outings o
         JOIN outing_guests g
           ON g."outingId" = o.id AND g."userId" = $2 AND g.status = 'going'
        WHERE o."placeId" = $1 AND o.status = 'done'
        LIMIT 1`,
      [placeId, userId],
    );

    if (rows.length === 0) {
      throw new ForbiddenException(
        'Solo pueden subir fotos quienes visitaron el lugar',
      );
    }
  }

  /** Existe el lugar, o 404. */
  private async assertExists(placeId: number): Promise<Place> {
    const place = await this.placesRepository.findOne({
      where: { id: placeId },
    });

    if (!place) {
      throw new NotFoundException(`Lugar con ID ${placeId} no encontrado`);
    }

    return place;
  }

  listImages(placeId: number): Promise<ImageView[]> {
    return this.images.listFor('places', placeId);
  }

  /**
   * Suma una foto a la galería. La primera se usa además como foto
   * principal: un lugar sin `photoUrl` cae a la imagen por defecto, y que
   * la primera que sube alguien lo destape es lo esperable.
   */
  async addImage(
    placeId: number,
    userId: number,
    file: UploadedFile | undefined,
  ): Promise<ImageView> {
    const place = await this.assertExists(placeId);
    await this.assertVisited(placeId, userId);

    const image = await this.images.add({
      resource: 'places',
      resourceId: placeId,
      file,
      userId,
    });

    if (!place.photoUrl) {
      await this.placesRepository.update(placeId, { photoUrl: image.url });
    }

    return image;
  }

  /**
   * Borra una foto de la galería. Solo quien la subió: el lugar es público
   * y no tiene dueño, así que nadie más tiene título sobre esa foto.
   */
  async removeImage(
    placeId: number,
    imageId: number,
    userId: number,
  ): Promise<void> {
    const place = await this.assertExists(placeId);
    const image = await this.images.findOwned('places', placeId, imageId);

    if (image.uploadedById !== userId) {
      throw new ForbiddenException('Solo podés borrar las fotos que subiste');
    }

    await this.images.remove(image);

    /* Si era la principal, el lugar no puede quedar apuntando a un archivo
       borrado: pasa a la siguiente de la galería, o a ninguna. */
    if (place.photoUrl === image.url) {
      const remaining = await this.images.listFor('places', placeId);
      await this.placesRepository.update(placeId, {
        photoUrl: remaining[0]?.url ?? null,
      });
    }
  }

  /**
   * Busca un lugar ya cargado que sea "el mismo": mismo nombre normalizado y
   * a menos de `DUPLICATE_RADIUS_M` metros.
   *
   * El nombre solo no alcanza (hay cadenas con sucursales) y la distancia
   * sola tampoco (en una galería hay diez locales en el mismo punto): hacen
   * falta los dos.
   */
  private async findDuplicate(dto: CreatePlaceDto): Promise<Place | null> {
    const rows = await this.placesRepository.manager.query<{ id: number }[]>(
      `SELECT id
         FROM places
        WHERE lower(btrim(name)) = lower(btrim($1))
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          /* Haversine en SQL: no hace falta PostGIS para un radio chico. */
          AND 6371000 * 2 * asin(sqrt(
                power(sin(radians(latitude - $2) / 2), 2)
                + cos(radians($2)) * cos(radians(latitude))
                * power(sin(radians(longitude - $3) / 2), 2)
              )) <= $4
        ORDER BY id
        LIMIT 1`,
      [dto.name, dto.latitude, dto.longitude, DUPLICATE_RADIUS_M],
    );

    const found = rows[0];
    if (!found) return null;

    return this.placesRepository.findOne({ where: { id: found.id } });
  }

  /**
   * Registra el lugar, o devuelve el que ya estaba.
   *
   * Devolver el existente en vez de rechazar con un 409: quien está cargando
   * una salida quiere seguir con su salida, no enterarse de que otro cargó
   * el lugar antes. La reseña termina en la ficha que ya tenía historia.
   */
  async create(userId: number, dto: CreatePlaceDto): Promise<Place> {
    const duplicate = await this.findDuplicate(dto);
    if (duplicate) return duplicate;

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
      `${PLACE_STATS_CTE}${PLACE_COMMENT_CTE}
       SELECT p.id, p.name, p.address, p.city, p.province, p.country,
              p.latitude, p.longitude, p.instagram, p."photoUrl",
              ps.derulis, COALESCE(ps.visit_count, 0) AS "visitCount",
              pc.comment
         FROM places p
         LEFT JOIN place_stats ps ON ps.place_id = p.id
         LEFT JOIN place_comment pc ON pc.place_id = p.id
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
