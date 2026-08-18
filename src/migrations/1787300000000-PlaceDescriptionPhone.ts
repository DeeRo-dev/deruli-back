import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlaceDescriptionPhone1787300000000 implements MigrationInterface {
  name = 'PlaceDescriptionPhone1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "places" ADD "description" text`);
    await queryRunner.query(
      `ALTER TABLE "places" ADD "phone" character varying(30)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "description"`);
  }
}
