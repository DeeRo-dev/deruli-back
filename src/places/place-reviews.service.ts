import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outing } from '../outings/outing.entity';
import { PlacesService } from './places.service';
import { ScoringService, average } from '../scoring/scoring.service';
import type { DinerScore } from '../scoring/scoring.service';

export interface TableReview {
  outingId: number;
  tableId: number;
  tableName: string;
  date: Date;
  totalSpend: number | null;
  /** Promedio de los comensales de esa mesa. */
  derulis: number | null;
  diners: DinerScore[];
}

@Injectable()
export class PlaceReviewsService {
  constructor(
    @InjectRepository(Outing)
    private outingsRepository: Repository<Outing>,
    private placesService: PlacesService,
    private scoringService: ScoringService,
  ) {}

  /** Detalle del lugar con su promedio global y cuántas veces lo visitaron. */
  async getPlaceDetail(placeId: number) {
    const place = await this.placesService.findOne(placeId);
    const { derulis, visitCount } =
      await this.scoringService.getPlaceAverage(placeId);

    return { ...place, derulis, visitCount };
  }

  async getPlaceReviews(placeId: number) {
    const place = await this.placesService.findOne(placeId);

    // Solo salidas que ya ocurrieron: no se puntúa algo que no pasó.
    const outings = await this.outingsRepository.find({
      where: { placeId, status: 'done' },
      relations: { table: true },
      order: { dateTime: 'DESC' },
    });

    const scores = await this.scoringService.getOutingScores(
      outings.map((outing) => outing.id),
    );

    const tables: TableReview[] = outings.map((outing) => {
      const score = scores.get(outing.id);
      return {
        outingId: outing.id,
        tableId: outing.tableId,
        tableName: outing.table.name,
        date: outing.dateTime,
        totalSpend: outing.totalSpend,
        derulis: score?.derulis ?? null,
        diners: score?.diners ?? [],
      };
    });

    const tableScores = tables
      .map((table) => table.derulis)
      .filter((value): value is number => value !== null);

    return {
      place,
      derulis: average(tableScores),
      visitCount: tables.length,
      tables,
    };
  }
}
