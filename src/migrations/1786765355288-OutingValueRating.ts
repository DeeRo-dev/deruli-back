import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutingValueRating1786765355288 implements MigrationInterface {
  name = 'OutingValueRating1786765355288';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outing_ratings" ADD "valueDerulis" smallint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outing_ratings" DROP COLUMN "valueDerulis"`,
    );
  }
}
