import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './place.entity';
import { Outing } from '../outings/outing.entity';
import { PlaceReviewsService } from './place-reviews.service';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { GeocodingService } from './geocoding.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [TypeOrmModule.forFeature([Place, Outing]), ScoringModule],
  controllers: [PlacesController],
  providers: [PlacesService, PlaceReviewsService, GeocodingService],
  exports: [PlacesService, PlaceReviewsService],
})
export class PlacesModule {}
