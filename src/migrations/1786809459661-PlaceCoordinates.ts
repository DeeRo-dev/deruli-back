import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlaceCoordinates1786809459661 implements MigrationInterface {
  name = 'PlaceCoordinates1786809459661';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "places" ADD "latitude" numeric(9,6)`);
    await queryRunner.query(
      `ALTER TABLE "places" ADD "longitude" numeric(9,6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "latitude"`);
  }
}
