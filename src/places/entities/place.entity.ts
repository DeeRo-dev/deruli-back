// src/modules/places/place.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/users.entity';

@Entity('places')
export class Place {
  @PrimaryGeneratedColumn()
  id: number;

  // 🔥 DATOS BÁSICOS
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // 🔥 UBICACIÓN
  @Column({ length: 100 })
  province: string;

  @Column({ length: 100 })
  city: string; // ← Agregué ciudad (más específico)

  @Column({ length: 255 })
  address: string;

  @Column({ length: 100, nullable: true })
  neighborhood: string; // ← Barrio (útil para búsquedas)


  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  website: string; 

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  instagram: string;

 
  @Column({ type: 'simple-array', nullable: true })
  tags: string[]; 

  // METADATOS
  @Column({ default: true })
  isActive: boolean; // ← Para desactivar en lugar de eliminar

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdBy: User; 

  @Column({ nullable: true })
  createdById: number;

  // 🔥 RELACIONES (visits/wishlist removed — entidades no encontradas)

  // 🔥 TIMESTAMPS
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
