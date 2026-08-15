import { MigrationInterface, QueryRunner } from 'typeorm';

export class InviteCodeRequired1786763003017 implements MigrationInterface {
  name = 'InviteCodeRequired1786763003017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* Relleno antes del ALTER: si alguna base tiene mesas creadas cuando la
       columna era nullable, el SET NOT NULL fallaría. En la base de
       desarrollo actual no hay ninguna, pero esta migración también corre
       en entornos que no vemos.

       translate() saca 0 y 1 del hexadecimal para no dejar códigos con
       caracteres que se confunden al dictarlos, igual que hace
       generateInviteCode() en la app. */
    await queryRunner.query(`
      UPDATE "tables"
      SET "inviteCode" = translate(
        upper(substr(md5(random()::text || id::text), 1, 8)),
        '01', '89'
      )
      WHERE "inviteCode" IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "tables" ALTER COLUMN "inviteCode" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tables" ALTER COLUMN "inviteCode" DROP NOT NULL`,
    );
  }
}
