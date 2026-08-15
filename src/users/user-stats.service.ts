import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

export interface UserStats {
  /** Lugares distintos donde comió: no cuenta dos veces el mismo. */
  placesVisited: number;
  /** Salidas en las que dejó al menos una puntuación. */
  reviewsCount: number;
  /** Platos que puntuó, sumando todas las salidas. */
  mealsRated: number;
  /** Mesas de las que es miembro. */
  tablesCount: number;
}

@Injectable()
export class UserStatsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Todo en una consulta con subqueries: son cuatro conteos independientes
   * y hacerlos por separado serían cuatro viajes a la base.
   *
   * Solo cuentan las salidas 'done' y donde el usuario fue realmente
   * ('going'): estar invitado no es haber visitado.
   */
  async getStats(userId: number): Promise<UserStats> {
    const rows = await this.usersRepository.manager.query<
      {
        places_visited: string;
        reviews_count: string;
        meals_rated: string;
        tables_count: string;
      }[]
    >(
      `SELECT
         (SELECT COUNT(DISTINCT o."placeId")
            FROM outings o
            JOIN outing_guests g
              ON g."outingId" = o.id AND g."userId" = $1 AND g.status = 'going'
           WHERE o.status = 'done') AS places_visited,

         (SELECT COUNT(DISTINCT outing_id) FROM (
             SELECT r."outingId" AS outing_id
               FROM outing_ratings r WHERE r."userId" = $1
             UNION
             SELECT m."outingId"
               FROM meal_ratings mr
               JOIN meals m ON m.id = mr."mealId"
              WHERE mr."userId" = $1
           ) AS rated) AS reviews_count,

         (SELECT COUNT(*) FROM meal_ratings WHERE "userId" = $1) AS meals_rated,

         (SELECT COUNT(*) FROM table_members
           WHERE "userId" = $1 AND status = 'accepted') AS tables_count`,
      [userId],
    );

    const row = rows[0];

    return {
      placesVisited: Number(row?.places_visited ?? 0),
      reviewsCount: Number(row?.reviews_count ?? 0),
      mealsRated: Number(row?.meals_rated ?? 0),
      tablesCount: Number(row?.tables_count ?? 0),
    };
  }
}
