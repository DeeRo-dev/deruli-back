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
import { Outing } from './outing.entity';

/**
 * 'going'    — confirmó que va (o ya está en el lugar). Puede puntuar.
 * 'invited'  — lo invitaron a una salida futura, todavía no respondió.
 * 'declined' — dijo que no va. Se conserva la fila para no volver a
 *              invitarlo y para que el creador vea quién rechazó.
 */
export type OutingGuestStatus = 'going' | 'invited' | 'declined';

/**
 * Quién va a la salida. Se separa de TableMember porque no siempre va toda
 * la mesa, y solo quien fue puede puntuar.
 */
@Unique('UQ_outing_guest', ['outingId', 'userId'])
@Entity('outing_guests')
export class OutingGuest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Outing, (outing) => outing.guests, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'outingId' })
  outing: Outing;

  @Column()
  outingId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 20, default: 'going' })
  status: OutingGuestStatus;

  @CreateDateColumn()
  createdAt: Date;
}
