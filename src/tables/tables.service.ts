import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './table.entity';
import { TableMember } from './table-member.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { Outing } from '../outings/outing.entity';
import { generateInviteCode, normalizeInviteCode } from './lib/invite-code';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private tablesRepository: Repository<Table>,
    @InjectRepository(TableMember)
    private membersRepository: Repository<TableMember>,
    @InjectRepository(Outing)
    private outingsRepository: Repository<Outing>,
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
    return this.tablesRepository
      .createQueryBuilder('table')
      .innerJoin('table.members', 'membership', 'membership.userId = :userId', {
        userId,
      })
      .leftJoinAndSelect('table.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .orderBy('table.updatedAt', 'DESC')
      .getMany();
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

    // El front necesita las dos listas en la misma pantalla.
    table.upcomingOuting = await this.outingsRepository.findOne({
      where: { tableId: id, status: 'planned' },
      relations: { place: true },
      order: { dateTime: 'ASC' },
    });

    table.pastVisits = await this.outingsRepository.find({
      where: { tableId: id, status: 'done' },
      relations: { place: true },
      order: { dateTime: 'DESC' },
      take: 10,
    });

    return table;
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
