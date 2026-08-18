import { MigrationInterface, QueryRunner } from 'typeorm';

export class Favorites1787200000000 implements MigrationInterface {
  name = 'Favorites1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "favorites" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "placeId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_favorite" UNIQUE ("userId", "placeId"),
        CONSTRAINT "PK_favorites" PRIMARY KEY ("id")
      )
    `);

    // "los favoritos de este usuario" es la única consulta que existe.
    await queryRunner.query(
      `CREATE INDEX "IDX_favorite_user" ON "favorites" ("userId")`,
    );

    /* CASCADE en los dos lados: un favorito sin usuario o sin lugar no
       significa nada, y acá sí sirve —a diferencia de las imágenes— porque
       no hay ningún archivo externo que limpiar. */
    await queryRunner.query(`
      ALTER TABLE "favorites"
        ADD CONSTRAINT "FK_favorite_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "favorites"
        ADD CONSTRAINT "FK_favorite_place"
        FOREIGN KEY ("placeId") REFERENCES "places"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_favorite_place"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_favorite_user"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_favorite_user"`);
    await queryRunner.query(`DROP TABLE "favorites"`);
  }
}
