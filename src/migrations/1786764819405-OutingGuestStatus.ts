import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutingGuestStatus1786764819405 implements MigrationInterface {
  name = 'OutingGuestStatus1786764819405';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outing_guests" ADD "status" character varying(20) NOT NULL DEFAULT 'going'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "outing_guests" DROP COLUMN "status"`);
  }
}
