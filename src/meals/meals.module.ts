import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meal } from './meal.entity';
import { MealRating } from './meal-rating.entity';
import {
  OutingMealsController,
  MealRatingController,
} from './meals.controller';
import { MealsService } from './meals.service';
import { OutingsModule } from '../outings/outings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meal, MealRating]), OutingsModule],
  controllers: [OutingMealsController, MealRatingController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
