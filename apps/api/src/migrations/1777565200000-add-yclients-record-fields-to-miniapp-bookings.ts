import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddYclientsRecordFieldsToMiniappBookings1777565200000
  implements MigrationInterface
{
  name = 'AddYclientsRecordFieldsToMiniappBookings1777565200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "miniapp_bookings" ADD COLUMN IF NOT EXISTS "yclients_record_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "miniapp_bookings" ADD COLUMN IF NOT EXISTS "yclients_record_hash" character varying(128)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "miniapp_bookings" DROP COLUMN IF EXISTS "yclients_record_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "miniapp_bookings" DROP COLUMN IF EXISTS "yclients_record_id"`,
    );
  }
}
