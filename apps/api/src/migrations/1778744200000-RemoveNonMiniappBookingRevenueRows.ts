import {MigrationInterface, QueryRunner} from 'typeorm';

export class RemoveNonMiniappBookingRevenueRows1778744200000
  implements MigrationInterface
{
  name = 'RemoveNonMiniappBookingRevenueRows1778744200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM miniapp_client_revenue revenue
      WHERE NOT EXISTS (
        SELECT 1
        FROM miniapp_bookings booking
        WHERE booking.yclients_record_id = revenue.yclients_record_id
      )
    `);
  }

  public async down(): Promise<void> {
    // noop: deleted rows were outside the strict miniapp-booking revenue scope
  }
}
