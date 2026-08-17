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
import { ImagesService } from '../storage/images.service';
import type { ImageView } from '../storage/images.service';
import type { UploadedFile } from '../storage/storage.service';

@Injectable()
export class MealsService {
  constructor(
    @InjectRepository(Meal)
    private mealsRepository: Repository<Meal>,
    @InjectRepository(MealRating)
    private ratingsRepository: Repository<MealRating>,
    private outingsService: OutingsService,
    private readonly images: ImagesService,
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

  /**
   * Las fotos de una reseña cuelgan de la puntuación del plato
   * (`meal_ratings`), no del plato: la foto es de lo que comió y opinó una
   * persona, y dos comensales del mismo plato tienen cada uno la suya.
   *
   * Se exige tener el plato puntuado: la foto acompaña a una opinión.
   */
  private async assertRated(
    mealId: number,
    userId: number,
  ): Promise<MealRating> {
    const rating = await this.ratingsRepository.findOne({
      where: { mealId, userId },
    });

    if (!rating) {
      throw new ForbiddenException('Puntuá el plato antes de subirle una foto');
    }

    return rating;
  }

  /** Fotos de lo que puntuó un comensal. Las ve cualquiera que vea la salida. */
  async listRatingImages(mealId: number, userId: number): Promise<ImageView[]> {
    const rating = await this.assertRated(mealId, userId);
    return this.images.listFor('reviews', rating.id);
  }

  async addRatingImage(
    mealId: number,
    userId: number,
    file: UploadedFile | undefined,
  ): Promise<ImageView> {
    const rating = await this.assertRated(mealId, userId);

    return this.images.add({
      resource: 'reviews',
      resourceId: rating.id,
      file,
      userId,
    });
  }

  async removeRatingImage(
    mealId: number,
    userId: number,
    imageId: number,
  ): Promise<void> {
    const rating = await this.assertRated(mealId, userId);
    const image = await this.images.findOwned('reviews', rating.id, imageId);

    // La puntuación es de una sola persona, así que ser su dueño alcanza.
    await this.images.remove(image);
  }

  async removeRating(mealId: number, userId: number): Promise<void> {
    /* Las fotos se van con la puntuación: quedarían colgadas de una reseña
       que ya no existe, y Postgres no puede borrar los archivos solo. */
    const rating = await this.ratingsRepository.findOne({
      where: { mealId, userId },
    });

    if (rating) {
      await this.images.deleteAllFor('reviews', rating.id);
    }

    const result = await this.ratingsRepository.delete({ mealId, userId });

    if (result.affected === 0) {
      throw new ForbiddenException('No tenías puntuada esta comida');
    }
  }
}
