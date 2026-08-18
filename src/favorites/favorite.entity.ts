import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Place } from '../places/place.entity';

/**
 * Un lugar guardado por un usuario para volver.
 *
 * Es una tabla propia y no una columna: la relación es de muchos a muchos y
 * cada persona tiene su lista. No guarda nada más que el vínculo — si algún
 * día hacen falta notas o listas con nombre, se le agregan columnas acá.
 */
@Unique('UQ_favorite', ['userId', 'placeId'])
@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Indexado: la consulta de siempre es "los favoritos de este usuario". */
  @Index()
  @Column()
  userId: number;

  @ManyToOne(() => Place, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'placeId' })
  place: Place;

  @Column()
  placeId: number;

  /** La lista se ordena por esto: lo último guardado va primero. */
  @CreateDateColumn()
  createdAt: Date;
}
