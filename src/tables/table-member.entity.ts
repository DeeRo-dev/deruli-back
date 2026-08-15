import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Table } from './table.entity';

export type TableMemberStatus = 'invited' | 'accepted';

/** Un usuario no puede estar dos veces en la misma mesa. */
@Unique('UQ_table_member', ['tableId', 'userId'])
@Entity('table_members')
export class TableMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Table, (table) => table.members, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tableId' })
  table: Table;

  @Column()
  tableId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 20, default: 'invited' })
  status: TableMemberStatus;

  @CreateDateColumn()
  createdAt: Date;
}
