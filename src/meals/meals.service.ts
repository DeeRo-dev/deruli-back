import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meal } from './meal.entity';
import { MealRating } from './meal-rating.entity';
import { CreateMealDto, RateMealDto } from './dto/meal.dto';
import { OutingsService } from '../outings/outings.service';

@Injectable()
export class MealsService {
  constructor(
    @InjectRepository(Meal)
    private mealsRepository: Repository<Meal>,
    @InjectRepository(MealRating)
    private ratingsRepository: Repository<MealRating>,
    private outingsService: OutingsService,
  ) {}

  async create(
    outingId: number,
    userId: number,
    dto: CreateMealDto,
  ): Promise<Meal> {
    await this.outingsService.assertGuest(outingId, userId);

    const meal = this.mealsRepository.create({
      outingId,
      name: dto.name.trim(),
      price: dto.price ?? null,
      createdById: userId,
    });

    return this.mealsRepository.save(meal);
  }

  async findAllForOuting(outingId: number, userId: number): Promise<Meal[]> {
    // Alcanza con ser miembro de la mesa para mirar lo que se pidió.
    await this.outingsService.findOneForUser(outingId, userId);

    return this.mealsRepository.find({
      where: { outingId },
      relations: { ratings: { user: true } },
      order: { id: 'ASC' },
    });
  }

  /**
   * Upsert: puntuar de nuevo pisa tu puntaje anterior en vez de fallar por
   * el índice único. Cambiar de opinión es normal.
   */
  async rate(
    mealId: number,
    userId: number,
    dto: RateMealDto,
  ): Promise<MealRating> {
    const meal = await this.mealsRepository.findOne({ where: { id: mealId } });

    if (!meal) {
      throw new NotFoundException(`Comida con ID ${mealId} no encontrada`);
    }

    // Solo puntúa quien fue: los miembros que no asistieron, no.
    await this.outingsService.assertGuest(meal.outingId, userId);

    const existing = await this.ratingsRepository.findOne({
      where: { mealId, userId },
    });

    const rating =
      existing ?? this.ratingsRepository.create({ mealId, userId });
    rating.derulis = dto.derulis;
    rating.comment = dto.comment?.trim() || null;

    return this.ratingsRepository.save(rating);
  }

  async removeRating(mealId: number, userId: number): Promise<void> {
    const result = await this.ratingsRepository.delete({ mealId, userId });

    if (result.affected === 0) {
      throw new ForbiddenException('No tenías puntuada esta comida');
    }
  }
}
