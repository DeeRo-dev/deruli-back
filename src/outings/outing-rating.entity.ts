import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Outing } from './outing.entity';

/**
 * Lo que puntuó un comensal sobre la salida en sí: el lugar y la atención.
 * Las comidas se puntúan aparte, en MealRating.
 */
@Unique('UQ_outing_rating', ['outingId', 'userId'])
@Entity('outing_ratings')
export class OutingRating {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Outing, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outingId' })
  outing: Outing;

  @Column()
  outingId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  /** El lugar en sí: ambiente, comodidad, si volverías. */
  @Column({ type: 'smallint' })
  placeDerulis: number;

  /** La atención al cliente. */
  @Column({ type: 'smallint' })
  serviceDerulis: number;

  /**
   * Relación precio-calidad. Nullable solo por las puntuaciones cargadas
   * antes de existir el criterio; toda puntuación nueva lo trae.
   */
  @Column({ type: 'smallint', nullable: true })
  valueDerulis: number | null;

  /** Comentario general de la visita, más allá de cada plato. */
  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
