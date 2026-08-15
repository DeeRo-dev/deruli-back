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
import { Meal } from './meal.entity';

/** Lo que puntuó un comensal sobre un plato: 1 a 5 derulis + comentario. */
@Unique('UQ_meal_rating', ['mealId', 'userId'])
@Entity('meal_ratings')
export class MealRating {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Meal, (meal) => meal.ratings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mealId' })
  meal: Meal;

  @Column()
  mealId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'smallint' })
  derulis: number;

  /** El "por qué" del puntaje. Es lo que se lee en el detalle del lugar. */
  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
