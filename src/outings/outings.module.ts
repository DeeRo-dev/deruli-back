import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Outing } from './outing.entity';
import { OutingGuest } from './outing-guest.entity';
import { OutingRating } from './outing-rating.entity';
import {
  OutingsController,
  TableOutingsController,
} from './outings.controller';
import { OutingsService } from './outings.service';
import { TablesModule } from '../tables/tables.module';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Outing, OutingGuest, OutingRating]),
    TablesModule,
    PlacesModule,
  ],
  controllers: [TableOutingsController, OutingsController],
  providers: [OutingsService],
  exports: [OutingsService],
})
export class OutingsModule {}
