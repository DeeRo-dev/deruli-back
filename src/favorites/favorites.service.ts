import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { Place } from '../places/place.entity';
import { PLACE_STATS_CTE } from '../places/places.search';
import type { PlaceRow } from '../places/places.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(Place)
    private readonly placesRepository: Repository<Place>,
  ) {}

  /**
   * Los lugares guardados, con su puntaje.
   *
   * Devuelve la misma forma que `/places` para que el front reutilice la
   * tarjeta del listado sin traducir nada. Por eso repite el CTE de
   * estadísticas en vez de traer los lugares pelados.
   */
  async listFor(userId: number): Promise<PlaceRow[]> {
    const rows = await this.favoritesRepository.manager.query<PlaceRow[]>(
      `${PLACE_STATS_CTE}
       SELECT p.id, p.name, p.address, p.city, p.province, p.country,
              p.latitude, p.longitude, p.instagram, p."photoUrl",
              ps.derulis, COALESCE(ps.visit_count, 0) AS "visitCount"
         FROM favorites f
         JOIN places p ON p.id = f."placeId"
         LEFT JOIN place_stats ps ON ps.place_id = p.id
        WHERE f."userId" = $1
        ORDER BY f."createdAt" DESC`,
      [userId],
    );

    // numeric llega como string desde la query cruda.
    return rows.map((row) => ({
      ...row,
      derulis:
        row.derulis === null
          ? null
          : Math.round(Number(row.derulis) * 100) / 100,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      visitCount: Number(row.visitCount),
      comment: null,
    }));
  }

  /** Solo los ids. Es lo que necesita el front para pintar los corazones. */
  async listPlaceIdsFor(userId: number): Promise<number[]> {
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      select: { placeId: true },
      order: { createdAt: 'DESC' },
    });

    return favorites.map((favorite) => favorite.placeId);
  }

  /**
   * Guarda el lugar. Idempotente: marcar dos veces no es un error, es el
   * mismo resultado. Evita que un doble toque devuelva un 409 inútil.
   */
  async add(userId: number, placeId: number): Promise<Favorite> {
    const place = await this.placesRepository.findOne({
      where: { id: placeId },
    });

    if (!place) {
      throw new NotFoundException(`Lugar con ID ${placeId} no encontrado`);
    }

    const existing = await this.favoritesRepository.findOne({
      where: { userId, placeId },
    });

    if (existing) return existing;

    return this.favoritesRepository.save(
      this.favoritesRepository.create({ userId, placeId }),
    );
  }

  /** Idempotente por el mismo motivo: si no estaba, el resultado es el mismo. */
  async remove(userId: number, placeId: number): Promise<void> {
    await this.favoritesRepository.delete({ userId, placeId });
  }
}
