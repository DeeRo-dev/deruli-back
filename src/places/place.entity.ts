import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('places')
export class Place {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  name: string;

  @Column()
  address: string;

  /* Ciudad y provincia son nullable solo por los lugares cargados antes de
     existir estos campos. El formulario los pide para todo lugar nuevo. */
  @Index()
  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Index()
  @Column({ type: 'varchar', length: 120, nullable: true })
  province: string | null;

  @Index()
  @Column({ type: 'varchar', length: 120, default: 'Argentina' })
  country: string;

  /* Coordenadas para el mapa. numeric conserva la precisión (float no), y
     el transformer las devuelve como number: sin él, pg entrega strings y
     el front recibiría "-34.603722" en vez de -34.603722. */
  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  latitude: number | null;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  longitude: number | null;

  /**
   * Cuándo se intentó geocodificar la dirección. Marca el intento, no el
   * éxito: sin esto, un lugar con dirección imposible de resolver
   * consultaría al geocoder cada vez que alguien abre su pantalla.
   */
  @Column({ type: 'timestamp', nullable: true })
  geocodedAt: Date | null;

  /** Handle sin la arroba, ej. "osteriabianca". */
  @Column({ nullable: true, type: 'varchar' })
  instagram: string | null;

  /** Mientras no haya storage, el front cae a una imagen por defecto. */
  @Column({ nullable: true, type: 'varchar' })
  photoUrl: string | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
