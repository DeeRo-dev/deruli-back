import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Table } from './table.entity';
import { TableMember } from './table-member.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { Outing } from '../outings/outing.entity';
import { generateInviteCode, normalizeInviteCode } from './lib/invite-code';
import { ImagesService } from '../storage/images.service';
import type { ImageView } from '../storage/images.service';
import type { UploadedFile } from '../storage/storage.service';
import {
  hasOccurred,
  occurredWhere,
  pendingWhere,
  upcomingWhere,
} from '../outings/outing-occurred';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private tablesRepository: Repository<Table>,
    @InjectRepository(TableMember)
    private membersRepository: Repository<TableMember>,
    @InjectRepository(Outing)
    private outingsRepository: Repository<Outing>,
    private readonly images: ImagesService,
  ) {}

  async create(userId: number, dto: CreateTableDto): Promise<Table> {
    const table = this.tablesRepository.create({
      name: dto.name.trim(),
      description: dto.description?.trim() ?? '',
      isPrivate: dto.isPrivate ?? true,
      inviteCode: await this.generateUniqueInviteCode(),
      createdById: userId,
      // El creador queda dentro desde el arranque: una mesa de un solo
      // comensal es válida, comer solo no es un caso borde.
      members: [this.membersRepository.create({ userId, status: 'accepted' })],
    });

    const saved = await this.tablesRepository.save(table);

    // Se relee para devolver la MISMA forma que el detalle: el save deja
    // members sin la relación user cargada, y el front la necesita.
    return this.findOneForUser(saved.id, userId);
  }

  /** Reintenta ante la chance remota de colisión con un código existente. */
  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateInviteCode();
      const taken = await this.tablesRepository.exists({
        where: { inviteCode: code },
      });
      if (!taken) return code;
    }

    throw new InternalServerErrorException(
      'No pudimos generar un código de invitación',
    );
  }

  /** Sumarse a una mesa con el código. Idempotente si ya sos miembro. */
  async joinByInviteCode(code: string, userId: number): Promise<Table> {
    const table = await this.tablesRepository.findOne({
      where: { inviteCode: normalizeInviteCode(code) },
    });

    if (!table) {
      throw new NotFoundException('El código de invitación no es válido');
    }

    const existing = await this.membersRepository.findOne({
      where: { tableId: table.id, userId },
    });

    if (!existing) {
      await this.membersRepository.save(
        this.membersRepository.create({
          tableId: table.id,
          userId,
          status: 'accepted',
        }),
      );
    } else if (existing.status !== 'accepted') {
      existing.status = 'accepted';
      await this.membersRepository.save(existing);
    }

    return this.findOneForUser(table.id, userId);
  }

  /** Solo las mesas donde el usuario es miembro. */
  async findAllForUser(userId: number): Promise<Table[]> {
    const tables = await this.tablesRepository
      .createQueryBuilder('table')
      .innerJoin('table.members', 'membership', 'membership.userId = :userId', {
        userId,
      })
      .leftJoinAndSelect('table.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .orderBy('table.updatedAt', 'DESC')
      .getMany();

    if (tables.length === 0) return tables;

    /* Una sola consulta para las salidas de todas las mesas, en vez de una
       por mesa: el listado se arma con dos queries, no con N+1. */
    const outings = await this.outingsRepository.find({
      where: { tableId: In(tables.map((table) => table.id)) },
      relations: { place: true },
      order: { dateTime: 'DESC' },
    });

    for (const table of tables) {
      const own = outings.filter((outing) => outing.tableId === table.id);
      table.lastVisit = own.find(hasOccurred) ?? null;
      /* La que ya ocurrió y sigue abierta: el listado la usa para avisar
         que a esa mesa le falta cargar la reseña. */
      table.pendingOuting =
        own.find(
          (outing) => outing.status === 'planned' && hasOccurred(outing),
        ) ?? null;
      /* `own` viene ordenado por fecha DESC: al revés, la primera que
         todavía no ocurrió es la más cercana en el tiempo. */
      table.upcomingOuting =
        [...own].reverse().find((outing) => !hasOccurred(outing)) ?? null;
    }

    return tables;
  }

  /**
   * Autoriza por pertenencia, no solo por login. Devuelve 404 y no 403 a
   * propósito: un extraño no debería poder confirmar que la mesa existe.
   */
  async findOneForUser(id: number, userId: number): Promise<Table> {
    const table = await this.tablesRepository.findOne({
      where: { id },
      relations: { members: { user: true } },
    });

    const isMember = table?.members.some((member) => member.userId === userId);

    if (!table || !isMember) {
      throw new NotFoundException(`Mesa con ID ${id} no encontrada`);
    }

    /* Tres cortes distintos y no dos: además de lo que viene y lo que
       ya pasó, está la salida que ocurrió y nadie cerró todavía. Esa es la
       que la mesa tiene que ver primero —le falta cargar lo que comieron—
       y antes quedaba anunciada como "próxima salida" para siempre. */
    table.upcomingOuting = await this.outingsRepository.findOne({
      where: upcomingWhere({ tableId: id }),
      relations: { place: true },
      order: { dateTime: 'ASC' },
    });

    table.pendingOuting = await this.outingsRepository.findOne({
      where: pendingWhere({ tableId: id }),
      relations: { place: true },
      order: { dateTime: 'DESC' },
    });

    const visits = await this.outingsRepository.find({
      where: occurredWhere({ tableId: id }),
      relations: { place: true },
      order: { dateTime: 'DESC' },
      take: 11,
    });

    // La pendiente ya se muestra arriba: repetirla en el historial sobra.
    table.pastVisits = visits
      .filter((outing) => outing.id !== table.pendingOuting?.id)
      .slice(0, 10);

    return table;
  }

  /**
   * Foto de la mesa. Cualquier miembro puede cambiarla: la mesa es del
   * grupo, no de quien la creó.
   */
  async setPhoto(
    tableId: number,
    userId: number,
    file: UploadedFile | undefined,
  ): Promise<{ photoUrl: string; image: ImageView }> {
    await this.assertMembership(tableId, userId);

    const image = await this.images.replaceSingle({
      resource: 'tables',
      resourceId: tableId,
      file,
      userId,
    });

    await this.tablesRepository.update(tableId, { photoUrl: image.url });

    return { photoUrl: image.url, image };
  }

  async removePhoto(tableId: number, userId: number): Promise<void> {
    await this.assertMembership(tableId, userId);
    await this.images.deleteAllFor('tables', tableId);
    await this.tablesRepository.update(tableId, { photoUrl: null });
  }

  /** Lanza 404 si el usuario no es miembro. Lo usa OutingsService. */
  async assertMembership(tableId: number, userId: number): Promise<void> {
    const membership = await this.membersRepository.findOne({
      where: { tableId, userId },
    });

    if (!membership) {
      throw new NotFoundException(`Mesa con ID ${tableId} no encontrada`);
    }
  }

  /** Ids de los miembros que ya aceptaron. */
  async getAcceptedMemberIds(tableId: number): Promise<number[]> {
    const members = await this.membersRepository.find({
      where: { tableId, status: 'accepted' },
      select: { userId: true },
    });

    return members.map((member) => member.userId);
  }
}
