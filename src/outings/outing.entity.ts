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
import { Place } from '../places/place.entity';
import { Table } from '../tables/table.entity';
import { OutingGuest } from './outing-guest.entity';

export type OutingStatus = 'planned' | 'done' | 'cancelled';

/**
 * "Salida" en la interfaz: una visita de una mesa a un lugar, en una fecha.
 * Una mesa tiene muchas salidas a lo largo del tiempo.
 */
@Entity('outings')
export class Outing {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Table, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableId' })
  table: Table;

  @Index()
  @Column()
  tableId: number;

  @ManyToOne(() => Place, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'placeId' })
  place: Place;

  @Column()
  placeId: number;

  @Column({ type: 'timestamp' })
  dateTime: Date;

  @Column({ default: false })
  booked: boolean;

  /** Gasto total en CENTAVOS. Entero, nunca float. */
  @Column({ type: 'int', nullable: true })
  totalSpend: number | null;

  @Column({ type: 'varchar', length: 20, default: 'planned' })
  status: OutingStatus;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: number;

  @OneToMany(() => OutingGuest, (guest) => guest.outing, { cascade: true })
  guests: OutingGuest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
