import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity';
import { Place } from '../places/place.entity';
import { FavoritesService } from './favorites.service';
import {
  FavoritesController,
  PlaceFavoriteController,
} from './favorites.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Place])],
  controllers: [FavoritesController, PlaceFavoriteController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
