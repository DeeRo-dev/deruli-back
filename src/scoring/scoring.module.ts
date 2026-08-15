import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Outing } from '../outings/outing.entity';
import { OutingRating } from '../outings/outing-rating.entity';
import { Meal } from '../meals/meal.entity';
import { MealRating } from '../meals/meal-rating.entity';
import { ScoringService } from './scoring.service';

/**
 * Módulo sin dependencias de otros módulos de dominio: así lo pueden usar
 * places y tables sin armar un ciclo entre ellos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Outing, OutingRating, Meal, MealRating])],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
