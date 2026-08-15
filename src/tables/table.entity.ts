import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/users.entity';
import { TableMember } from './table-member.entity';
// import type: evita un ciclo de imports en runtime con outing.entity,
// que a su vez importa Table.
import type { Outing } from '../outings/outing.entity';

/**
 * "Mesa" en la interfaz. Es un grupo que persiste en el tiempo: tiene
 * miembros fijos y, más adelante, muchas salidas (Outing).
 *
 * OJO: TABLE es palabra reservada en SQL, por eso el nombre físico va
 * explícito como 'tables' y hay que citarlo en cualquier query cruda.
 */
@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 280, default: '' })
  description: string;

  @Column({ default: true })
  isPrivate: boolean;

  /** Foto propia de la mesa. Editable más adelante; hoy siempre null. */
  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;

  /** Código para sumarse a la mesa sin invitación individual. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 12 })
  inviteCode: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: number;

  @OneToMany(() => TableMember, (member) => member.table, { cascade: true })
  members: TableMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /* Campos calculados, no persistidos: los arma TablesService para que el
     detalle de mesa se resuelva en una sola llamada. */
  upcomingOuting?: Outing | null;
  pastVisits?: Outing[];
  /** Última salida ya ocurrida. El listado muestra "Última: <lugar>". */
  lastVisit?: Outing | null;
}
