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

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100 })
  province: string;

  @Column({ length: 100 })
  city: string; 

  @Column({ length: 255 })
  address: string;

  @Column({ length: 100, nullable: true })
  neighborhood: string;


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

  @Column({ default: true })
  isActive: boolean; // 

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdBy: User; 

  @Column({ nullable: true })
  createdById: number;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
