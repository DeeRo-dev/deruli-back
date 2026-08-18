import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/users.entity';
import type { ImageResource } from './image-resource';

/**
 * Metadata de una imagen. El archivo vive en Supabase Storage; acá solo va
 * la referencia (ver brief: nada de base64 ni BLOB en Postgres).
 *
 * Una sola tabla polimórfica en vez de `place_images` + `review_images` +
 * una por cada feature futura. El motivo no es ahorrar tablas: es que el
 * objetivo declarado es que agregar imágenes a una feature nueva no
 * requiera rediseñar nada.
 *
 * Lo que se pierde con esto es la foreign key hacia cada recurso, y con
 * ella el ON DELETE CASCADE. En la práctica no se pierde tanto: un CASCADE
 * de Postgres borra la fila pero **no** el archivo en Supabase, así que
 * borrar el recurso padre exige pasar por el servicio igual (ver
 * `ImagesService.deleteAllFor`). La integridad hay que sostenerla en el
 * código en los dos diseños; este además escala a features nuevas.
 */
@Index('IDX_image_owner', ['resource', 'resourceId'])
@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  /** 'avatars' | 'places' | 'reviews' | 'tables' — ver IMAGE_RESOURCES. */
  @Column({ type: 'varchar', length: 32 })
  resource: ImageResource;

  /** Id del recurso dueño. Sin FK: el recurso depende de `resource`. */
  @Column({ type: 'int' })
  resourceId: number;

  /**
   * Ruta dentro del bucket, ej. "places/12/9f3a…c1.webp". Es lo único que
   * hace falta para borrar el archivo, y por eso es único.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 400 })
  storagePath: string;

  /**
   * URL pública, desnormalizada a propósito: se arma a partir del path y
   * del proyecto de Supabase, y guardarla evita reconstruirla en cada
   * lectura. Si algún día cambia el bucket, se regenera con un UPDATE.
   */
  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  sizeBytes: number;

  /**
   * Si la imagen se puede mostrar.
   *
   * Arranca en `true`: hoy no hay quien modere, y dejar las fotos
   * esperando aprobación sin nadie del otro lado sería esconderlas para
   * siempre. Cuando exista el panel de admin, lo único que cambia es el
   * default y quién lo pone en `true`; las lecturas ya filtran por esto.
   */
  @Column({ type: 'boolean', default: true })
  approved: boolean;

  /** Quién la subió. Sirve para moderar y para permisos de borrado. */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column()
  uploadedById: number;

  @CreateDateColumn()
  createdAt: Date;
}
