import { MigrationInterface, QueryRunner } from 'typeorm';

export class TablePhoto1786816007787 implements MigrationInterface {
  name = 'TablePhoto1786816007787';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tables" ADD "photoUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tables" DROP COLUMN "photoUrl"`);
  }
}
