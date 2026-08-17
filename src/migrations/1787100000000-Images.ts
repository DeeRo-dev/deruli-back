import { MigrationInterface, QueryRunner } from 'typeorm';

export class Images1787100000000 implements MigrationInterface {
  name = 'Images1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "images" (
        "id" SERIAL NOT NULL,
        "resource" character varying(32) NOT NULL,
        "resourceId" integer NOT NULL,
        "storagePath" character varying(400) NOT NULL,
        "url" text NOT NULL,
        "mimeType" character varying(100) NOT NULL,
        "sizeBytes" integer NOT NULL,
        "uploadedById" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_images" PRIMARY KEY ("id")
      )
    `);

    /* Único: el path lleva un UUID, así que dos filas con el mismo path
       significan que algo se duplicó. Además es la clave para borrar. */
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_image_storage_path" ON "images" ("storagePath")`,
    );

    // La consulta de siempre: "todas las imágenes de este recurso".
    await queryRunner.query(
      `CREATE INDEX "IDX_image_owner" ON "images" ("resource", "resourceId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "images"
        ADD CONSTRAINT "FK_image_uploaded_by"
        FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "images" DROP CONSTRAINT "FK_image_uploaded_by"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_image_owner"`);
    await queryRunner.query(`DROP INDEX "IDX_image_storage_path"`);
    await queryRunner.query(`DROP TABLE "images"`);
  }
}
