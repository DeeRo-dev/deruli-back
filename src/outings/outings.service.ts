import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outing, type OutingStatus } from './outing.entity';
import { OutingGuest } from './outing-guest.entity';
import { OutingRating } from './outing-rating.entity';
import { CreateOutingDto } from './dto/create-outing.dto';
import { UpdateOutingDto } from './dto/update-outing.dto';
import { RateOutingDto } from './dto/rate-outing.dto';
import { TablesService } from '../tables/tables.service';
import { PlacesService } from '../places/places.service';

@Injectable()
export class OutingsService {
  constructor(
    @InjectRepository(Outing)
    private outingsRepository: Repository<Outing>,
    @InjectRepository(OutingGuest)
    private guestsRepository: Repository<OutingGuest>,
    @InjectRepository(OutingRating)
    private outingRatingsRepository: Repository<OutingRating>,
    private tablesService: TablesService,
    private placesService: PlacesService,
  ) {}

  async create(
    tableId: number,
    userId: number,
    dto: CreateOutingDto,
  ): Promise<Outing> {
    await this.tablesService.assertMembership(tableId, userId);
    // Lanza 404 si el lugar no existe, antes de crear nada.
    await this.placesService.findOne(dto.placeId);

    /* El creador siempre va como 'going': proponer la salida ya expresa
       que piensa ir, y además tiene que poder cargar las comidas.
       Al resto se lo anota según el modo: si están en el lugar ahora van
       como 'going'; si es una salida agendada quedan 'invited' hasta que
       acepten. */
    const invited = dto.attendance === 'invited';
    const memberIds = await this.tablesService.getAcceptedMemberIds(tableId);

    // Filtrar por pertenencia: no se puede anotar a alguien ajeno a la mesa.
    const guestIds = (dto.guestIds ?? []).filter(
      (id) => id !== userId && memberIds.includes(id),
    );

    const outing = this.outingsRepository.create({
      tableId,
      placeId: dto.placeId,
      dateTime: new Date(dto.dateTime),
      booked: dto.booked ?? false,
      totalSpend: dto.totalSpend ?? null,
      status: 'planned',
      createdById: userId,
      guests: [
        this.guestsRepository.create({ userId, status: 'going' }),
        ...[...new Set(guestIds)].map((id) =>
          this.guestsRepository.create({
            userId: id,
            status: invited ? 'invited' : 'going',
          }),
        ),
      ],
    });

    const saved = await this.outingsRepository.save(outing);
    return this.findOneForUser(saved.id, userId);
  }

  async findAllForTable(
    tableId: number,
    userId: number,
    status?: OutingStatus,
  ): Promise<Outing[]> {
    await this.tablesService.assertMembership(tableId, userId);

    return this.outingsRepository.find({
      where: { tableId, ...(status ? { status } : {}) },
      relations: { place: true, guests: { user: true } },
      order: { dateTime: 'DESC' },
    });
  }

  async findOneForUser(id: number, userId: number): Promise<Outing> {
    const outing = await this.outingsRepository.findOne({
      where: { id },
      relations: { place: true, guests: { user: true }, table: true },
    });

    if (!outing) {
      throw new NotFoundException(`Salida con ID ${id} no encontrada`);
    }

    await this.tablesService.assertMembership(outing.tableId, userId);
    return outing;
  }

  /**
   * El miembro se suma a la salida. Idempotente: sumarse dos veces no
   * rompe ni duplica (además del índice único en la tabla).
   */
  async join(id: number, userId: number): Promise<Outing> {
    const outing = await this.findOneForUser(id, userId);

    if (outing.status !== 'planned') {
      throw new ConflictException(
        'Solo podés sumarte a una salida que todavía no ocurrió',
      );
    }

    const existing = outing.guests.find((guest) => guest.userId === userId);

    if (existing) {
      // Aceptar una invitación es lo mismo que sumarse.
      existing.status = 'going';
      await this.guestsRepository.save(existing);
    } else {
      await this.guestsRepository.save(
        this.guestsRepository.create({ outingId: id, userId, status: 'going' }),
      );
    }

    return this.findOneForUser(id, userId);
  }

  /** Bajarse o rechazar la invitación. */
  async leave(id: number, userId: number): Promise<Outing> {
    const outing = await this.findOneForUser(id, userId);

    if (outing.status !== 'planned') {
      throw new ConflictException(
        'No podés bajarte de una salida que ya ocurrió',
      );
    }

    /* Se marca 'declined' en vez de borrar la fila: así el creador ve
       quién rechazó y no se lo vuelve a invitar sin querer. */
    await this.guestsRepository.update(
      { outingId: id, userId },
      { status: 'declined' },
    );

    return this.findOneForUser(id, userId);
  }

  /**
   * Solo puntúa quien fue. Un miembro de la mesa que no se sumó a la
   * salida no puede opinar sobre una comida que no probó.
   */
  async assertGuest(outingId: number, userId: number): Promise<Outing> {
    const outing = await this.findOneForUser(outingId, userId);
    const isGoing = outing.guests.some(
      (guest) => guest.userId === userId && guest.status === 'going',
    );

    if (!isGoing) {
      throw new ForbiddenException(
        'Solo pueden puntuar los comensales que fueron a la salida',
      );
    }

    return outing;
  }

  /** Upsert: volver a puntuar pisa tu puntaje anterior. */
  async rate(
    id: number,
    userId: number,
    dto: RateOutingDto,
  ): Promise<OutingRating> {
    await this.assertGuest(id, userId);

    const existing = await this.outingRatingsRepository.findOne({
      where: { outingId: id, userId },
    });

    const rating =
      existing ?? this.outingRatingsRepository.create({ outingId: id, userId });

    rating.placeDerulis = dto.placeDerulis;
    rating.serviceDerulis = dto.serviceDerulis;
    rating.valueDerulis = dto.valueDerulis ?? null;
    rating.comment = dto.comment?.trim() || null;

    return this.outingRatingsRepository.save(rating);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateOutingDto,
  ): Promise<Outing> {
    const outing = await this.findOneForUser(id, userId);

    if (dto.dateTime !== undefined) outing.dateTime = new Date(dto.dateTime);
    if (dto.booked !== undefined) outing.booked = dto.booked;
    if (dto.totalSpend !== undefined) outing.totalSpend = dto.totalSpend;
    if (dto.status !== undefined) outing.status = dto.status;

    await this.outingsRepository.save(outing);
    return this.findOneForUser(id, userId);
  }
}
