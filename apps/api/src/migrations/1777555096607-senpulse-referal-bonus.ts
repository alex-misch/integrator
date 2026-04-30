import {MigrationInterface, QueryRunner} from 'typeorm';

export class SenpulseReferalBonus1777555096607 implements MigrationInterface {
  name = 'SenpulseReferalBonus1777555096607';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sendpulse_client" ADD "pending_referral_points" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b173f369828ac6b22bc48d4ef9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendpulse_client" ALTER COLUMN "tg_referrer" TYPE character varying USING "tg_referrer"::text`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b173f369828ac6b22bc48d4ef9" ON "sendpulse_client" ("tg_referrer") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b173f369828ac6b22bc48d4ef9"`,
    );
    await queryRunner.query(`
      ALTER TABLE "sendpulse_client"
      ALTER COLUMN "tg_referrer" TYPE bigint
      USING CASE
        WHEN "tg_referrer" ~ '^[0-9]+$' THEN "tg_referrer"::bigint
        ELSE NULL
      END
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_b173f369828ac6b22bc48d4ef9" ON "sendpulse_client" ("tg_referrer") `,
    );
    await queryRunner.query(
      `ALTER TABLE "sendpulse_client" DROP COLUMN "pending_referral_points"`,
    );
  }
}
