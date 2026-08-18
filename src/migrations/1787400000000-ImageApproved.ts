import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImageApproved1787400000000 implements MigrationInterface {
  name = 'ImageApproved1787400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "images" ADD "approved" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "images" DROP COLUMN "approved"`);
  }
}
