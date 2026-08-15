import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786761270295 implements MigrationInterface {
  name = 'InitialSchema1786761270295';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "avatar" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "places" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "address" character varying NOT NULL, "instagram" character varying, "photoUrl" character varying, "createdById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1afab86e226b4c3bc9a74465c12" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d93026712ed97941ccec28f813" ON "places"  ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "table_members" ("id" SERIAL NOT NULL, "tableId" integer NOT NULL, "userId" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'invited', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_table_member" UNIQUE ("tableId", "userId"), CONSTRAINT "PK_c46b1d59ad6df4d462c99ec3d59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tables" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying(280) NOT NULL DEFAULT '', "isPrivate" boolean NOT NULL DEFAULT true, "inviteCode" character varying(12), "createdById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7cf2aca7af9550742f855d4eb69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7513faf8265aa21523fd08bf85" ON "tables"  ("inviteCode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "outing_guests" ("id" SERIAL NOT NULL, "outingId" integer NOT NULL, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_outing_guest" UNIQUE ("outingId", "userId"), CONSTRAINT "PK_cc32ef0292789d0961893c2ff63" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "outings" ("id" SERIAL NOT NULL, "tableId" integer NOT NULL, "placeId" integer NOT NULL, "dateTime" TIMESTAMP NOT NULL, "booked" boolean NOT NULL DEFAULT false, "totalSpend" integer, "status" character varying(20) NOT NULL DEFAULT 'planned', "createdById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f99972a7e6f516c8d29c0959da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fad0a2793818579e7fa93717b3" ON "outings"  ("tableId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "meals" ("id" SERIAL NOT NULL, "outingId" integer NOT NULL, "name" character varying NOT NULL, "price" integer, "createdById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e6f830ac9b463433b58ad6f1a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e04ebf039f9df4554af98b44a" ON "meals"  ("outingId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "meal_ratings" ("id" SERIAL NOT NULL, "mealId" integer NOT NULL, "userId" integer NOT NULL, "derulis" smallint NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_meal_rating" UNIQUE ("mealId", "userId"), CONSTRAINT "PK_9b0213e4de6a6f7e30571eadf5d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "outing_ratings" ("id" SERIAL NOT NULL, "outingId" integer NOT NULL, "userId" integer NOT NULL, "placeDerulis" smallint NOT NULL, "serviceDerulis" smallint NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_outing_rating" UNIQUE ("outingId", "userId"), CONSTRAINT "PK_f11487d28c582f4d06b399e891e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "places" ADD CONSTRAINT "FK_a675f4d5aab30da0df6f7ee234e" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_members" ADD CONSTRAINT "FK_79570c2fb729d2807b0731ff3c2" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_members" ADD CONSTRAINT "FK_4f9c020b9dbd7d0d40bae3e88d0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tables" ADD CONSTRAINT "FK_3a5a370779e9efa28211f59519a" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "outing_guests" ADD CONSTRAINT "FK_5982344173fb1c394f10a02ec6d" FOREIGN KEY ("outingId") REFERENCES "outings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "outing_guests" ADD CONSTRAINT "FK_ff68bbf2dc20f60bd16d23e5ff8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "outings" ADD CONSTRAINT "FK_fad0a2793818579e7fa93717b3e" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "outings" ADD CONSTRAINT "FK_ec72ac0dbed66c3e1f685170719" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "outings" ADD CONSTRAINT "FK_e10d070ceabaec0dbcfb9c38e82" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meals" ADD CONSTRAINT "FK_9e04ebf039f9df4554af98b44a7" FOREIGN KEY ("outingId") REFERENCES "outings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meals" ADD CONSTRAINT "FK_1e5718c737b6fe4c5369646fd98" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_ratings" ADD CONSTRAINT "FK_41b42523c11d2ead0ecb7362fea" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_ratings" ADD CONSTRAINT "FK_f0449cd0013ffa693dcf660b2dd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "outing_ratings" ADD CONSTRAINT "FK_4906944b07310aaca3daed01f99" FOREIGN KEY ("outingId") REFERENCES "outings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "outing_ratings" ADD CONSTRAINT "FK_48ed93c70364dce169e7082f2b2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outing_ratings" DROP CONSTRAINT "FK_48ed93c70364dce169e7082f2b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outing_ratings" DROP CONSTRAINT "FK_4906944b07310aaca3daed01f99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_ratings" DROP CONSTRAINT "FK_f0449cd0013ffa693dcf660b2dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_ratings" DROP CONSTRAINT "FK_41b42523c11d2ead0ecb7362fea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meals" DROP CONSTRAINT "FK_1e5718c737b6fe4c5369646fd98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meals" DROP CONSTRAINT "FK_9e04ebf039f9df4554af98b44a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outings" DROP CONSTRAINT "FK_e10d070ceabaec0dbcfb9c38e82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outings" DROP CONSTRAINT "FK_ec72ac0dbed66c3e1f685170719"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outings" DROP CONSTRAINT "FK_fad0a2793818579e7fa93717b3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outing_guests" DROP CONSTRAINT "FK_ff68bbf2dc20f60bd16d23e5ff8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outing_guests" DROP CONSTRAINT "FK_5982344173fb1c394f10a02ec6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tables" DROP CONSTRAINT "FK_3a5a370779e9efa28211f59519a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_members" DROP CONSTRAINT "FK_4f9c020b9dbd7d0d40bae3e88d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_members" DROP CONSTRAINT "FK_79570c2fb729d2807b0731ff3c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "places" DROP CONSTRAINT "FK_a675f4d5aab30da0df6f7ee234e"`,
    );
    await queryRunner.query(`DROP TABLE "outing_ratings"`);
    await queryRunner.query(`DROP TABLE "meal_ratings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e04ebf039f9df4554af98b44a"`,
    );
    await queryRunner.query(`DROP TABLE "meals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fad0a2793818579e7fa93717b3"`,
    );
    await queryRunner.query(`DROP TABLE "outings"`);
    await queryRunner.query(`DROP TABLE "outing_guests"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7513faf8265aa21523fd08bf85"`,
    );
    await queryRunner.query(`DROP TABLE "tables"`);
    await queryRunner.query(`DROP TABLE "table_members"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d93026712ed97941ccec28f813"`,
    );
    await queryRunner.query(`DROP TABLE "places"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
