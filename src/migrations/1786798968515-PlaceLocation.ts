import { MigrationInterface, QueryRunner } from "typeorm";

export class PlaceLocation1786798968515 implements MigrationInterface {
    name = 'PlaceLocation1786798968515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "places" ADD "city" character varying(120)`);
        await queryRunner.query(`ALTER TABLE "places" ADD "province" character varying(120)`);
        await queryRunner.query(`ALTER TABLE "places" ADD "country" character varying(120) NOT NULL DEFAULT 'Argentina'`);
        await queryRunner.query(`CREATE INDEX "IDX_c4f157f2d30095762191283792" ON "places"  ("city") `);
        await queryRunner.query(`CREATE INDEX "IDX_900ab82c5ee077a514d88374f5" ON "places"  ("province") `);
        await queryRunner.query(`CREATE INDEX "IDX_8be45d59f95e0bd7e8ac261a89" ON "places"  ("country") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8be45d59f95e0bd7e8ac261a89"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_900ab82c5ee077a514d88374f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c4f157f2d30095762191283792"`);
        await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "province"`);
        await queryRunner.query(`ALTER TABLE "places" DROP COLUMN "city"`);
    }

}
