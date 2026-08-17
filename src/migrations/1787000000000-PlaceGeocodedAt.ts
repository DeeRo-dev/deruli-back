import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlaceGeocodedAt1787000000000 implements MigrationInterface {
  name = 'PlaceGeocodedAt1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "places" ADD "geocodedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "geocodedAt"`);
  }
}
