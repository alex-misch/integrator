import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddYclientsEventResourceColumns1777562100000
  implements MigrationInterface
{
  name = 'AddYclientsEventResourceColumns1777562100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "yclients_events" ADD COLUMN IF NOT EXISTS "resource" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "yclients_events" ADD COLUMN IF NOT EXISTS "resource_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "yclients_events" ADD COLUMN IF NOT EXISTS "status" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_c5e743e93d975799a4e38ad3a4" ON "yclients_events" ("resource_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_yclients_events_payment_unique" ON "yclients_events" ("resource_id") WHERE "resource_id" IS NOT NULL AND "event_name" = 'payment'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_yclients_events_payment_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_c5e743e93d975799a4e38ad3a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "yclients_events" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "yclients_events" DROP COLUMN IF EXISTS "resource_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "yclients_events" DROP COLUMN IF EXISTS "resource"`,
    );
  }
}
