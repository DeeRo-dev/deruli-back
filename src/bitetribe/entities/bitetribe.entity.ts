import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity('bitetribes')
export class Bitetribe {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 12 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  avatar: string;
  
}
