import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Outing } from '../outings/outing.entity';
import { MealRating } from './meal-rating.entity';

/** Un plato pedido en una salida. Se carga una vez y lo puntúa cada comensal. */
@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Outing, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outingId' })
  outing: Outing;

  @Index()
  @Column()
  outingId: number;

  @Column()
  name: string;

  /** Precio en CENTAVOS. Entero, nunca float. */
  @Column({ type: 'int', nullable: true })
  price: number | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: number;

  @OneToMany(() => MealRating, (rating) => rating.meal)
  ratings: MealRating[];

  @CreateDateColumn()
  createdAt: Date;
}
