import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Outing } from '../outings/outing.entity';
import { OutingRating } from '../outings/outing-rating.entity';
import { Meal } from '../meals/meal.entity';
import { MealRating } from '../meals/meal-rating.entity';
import { occurredWhere } from '../outings/outing-occurred';

/* CÓMO SE AGREGAN LOS DERULIS

   1. comensal = promedio plano de TODO lo que puntuó en la salida:
        · cada comida que comió, contando una por una
        · el lugar
        · la atención
        · la relación precio-calidad
      Ese número es su voto al lugar.
   2. mesa     = promedio de los comensales que puntuaron.
      Una mesa de 6 no vale más que una de 2.
   3. lugar    = promedio de las mesas que lo visitaron.

   Lo que no se puntúa se ignora: no puntuar no es un cero. */

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

export interface DinerScore {
  userId: number;
  name: string;
  /** Su voto: promedio de comida, lugar y atención. */
  derulis: number | null;
  /** Promedio de sus platos, ya normalizado a un solo valor. */
  mealsDerulis: number | null;
  placeDerulis: number | null;
  serviceDerulis: number | null;
  valueDerulis: number | null;
  comment: string | null;
  meals: {
    mealId: number;
    name: string;
    price: number | null;
    derulis: number | null;
    comment: string | null;
  }[];
}

export interface OutingScore {
  outingId: number;
  derulis: number | null;
  diners: DinerScore[];
}

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(Outing)
    private outingsRepository: Repository<Outing>,
    @InjectRepository(OutingRating)
    private outingRatingsRepository: Repository<OutingRating>,
    @InjectRepository(Meal)
    private mealsRepository: Repository<Meal>,
    @InjectRepository(MealRating)
    private mealRatingsRepository: Repository<MealRating>,
  ) {}

  /** Puntajes de varias salidas de una, indexados por outingId. */
  async getOutingScores(
    outingIds: number[],
  ): Promise<Map<number, OutingScore>> {
    const scores = new Map<number, OutingScore>();
    if (outingIds.length === 0) return scores;

    const outings = await this.outingsRepository.find({
      where: { id: In(outingIds) },
      relations: { guests: { user: true } },
    });

    const [outingRatings, meals] = await Promise.all([
      this.outingRatingsRepository.find({
        where: { outingId: In(outingIds) },
      }),
      this.mealsRepository.find({ where: { outingId: In(outingIds) } }),
    ]);

    const mealRatings = meals.length
      ? await this.mealRatingsRepository.find({
          where: { mealId: In(meals.map((meal) => meal.id)) },
        })
      : [];

    for (const outing of outings) {
      const outingMeals = meals.filter((meal) => meal.outingId === outing.id);

      /* Solo cuentan los que fueron: un invitado que nunca aceptó, o que
         rechazó, no puede aparecer como comensal de la visita. */
      const attended = outing.guests.filter(
        (guest) => guest.status === 'going',
      );

      const diners: DinerScore[] = attended.map((guest) => {
        const outingRating = outingRatings.find(
          (rating) =>
            rating.outingId === outing.id && rating.userId === guest.userId,
        );

        const dinerMeals = outingMeals.map((meal) => {
          const rating = mealRatings.find(
            (item) => item.mealId === meal.id && item.userId === guest.userId,
          );
          return {
            mealId: meal.id,
            name: meal.name,
            price: meal.price,
            derulis: rating?.derulis ?? null,
            comment: rating?.comment ?? null,
          };
        });

        const mealScores = dinerMeals
          .map((meal) => meal.derulis)
          .filter((value): value is number => value !== null);

        // Informativo: el promedio solo de comida, para mostrarlo aparte.
        const mealsDerulis = average(mealScores);

        // Cada comida entra al promedio por separado, igual que el lugar
        // y la atención.
        const components = [
          ...mealScores,
          outingRating?.placeDerulis ?? null,
          outingRating?.serviceDerulis ?? null,
          outingRating?.valueDerulis ?? null,
        ].filter((value): value is number => value !== null);

        return {
          userId: guest.userId,
          name: guest.user.name,
          derulis: average(components),
          mealsDerulis,
          placeDerulis: outingRating?.placeDerulis ?? null,
          serviceDerulis: outingRating?.serviceDerulis ?? null,
          valueDerulis: outingRating?.valueDerulis ?? null,
          comment: outingRating?.comment ?? null,
          meals: dinerMeals,
        };
      });

      const dinerScores = diners
        .map((diner) => diner.derulis)
        .filter((value): value is number => value !== null);

      scores.set(outing.id, {
        outingId: outing.id,
        derulis: average(dinerScores),
        diners,
      });
    }

    return scores;
  }

  /** Promedio global de un lugar: promedio de las mesas que lo visitaron. */
  async getPlaceAverage(
    placeId: number,
  ): Promise<{ derulis: number | null; visitCount: number }> {
    const outings = await this.outingsRepository.find({
      where: occurredWhere({ placeId }),
      select: { id: true },
    });

    const scores = await this.getOutingScores(
      outings.map((outing) => outing.id),
    );

    const tableScores = [...scores.values()]
      .map((score) => score.derulis)
      .filter((value): value is number => value !== null);

    return { derulis: average(tableScores), visitCount: outings.length };
  }
}
