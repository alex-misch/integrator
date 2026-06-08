import {MigrationInterface, QueryRunner} from 'typeorm';

export class BackfillMiniappBookingStatusesFromYclientsEvents1778743000000
  implements MigrationInterface
{
  name = 'BackfillMiniappBookingStatusesFromYclientsEvents1778743000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH latest_record_events AS (
        SELECT DISTINCT ON (resource_id)
          resource_id AS yclients_record_id,
          json,
          date_created,
          id
        FROM yclients_events
        WHERE resource = 'record'
          AND resource_id IS NOT NULL
        ORDER BY resource_id, date_created DESC, id DESC
      ),
      mapped AS (
        SELECT
          yclients_record_id,
          CASE
            WHEN COALESCE((json #>> '{data,deleted}')::boolean, false) = true
              THEN 'canceled'
            WHEN COALESCE(
              NULLIF(json #>> '{data,visit_attendance}', '')::int,
              NULLIF(json #>> '{data,attendance}', '')::int
            ) = -1
              THEN 'canceled'
            WHEN COALESCE(
              NULLIF(json #>> '{data,visit_attendance}', '')::int,
              NULLIF(json #>> '{data,attendance}', '')::int
            ) = 1
              THEN 'completed'
            WHEN COALESCE(
              NULLIF(json #>> '{data,visit_attendance}', '')::int,
              NULLIF(json #>> '{data,attendance}', '')::int
            ) IN (0, 2)
              THEN 'confirmed'
            ELSE NULL
          END AS next_status
        FROM latest_record_events
      )
      UPDATE miniapp_bookings b
      SET
        status = mapped.next_status,
        date_updated = NOW()
      FROM mapped
      WHERE b.yclients_record_id = mapped.yclients_record_id
        AND mapped.next_status IS NOT NULL
        AND b.status IS DISTINCT FROM mapped.next_status
    `);
  }

  public async down(): Promise<void> {
    // noop: status backfill cannot be safely reverted
  }
}
