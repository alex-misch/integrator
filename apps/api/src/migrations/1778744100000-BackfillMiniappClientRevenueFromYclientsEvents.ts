import {MigrationInterface, QueryRunner} from 'typeorm';

export class BackfillMiniappClientRevenueFromYclientsEvents1778744100000
  implements MigrationInterface
{
  name = 'BackfillMiniappClientRevenueFromYclientsEvents1778744100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO miniapp_client_revenue (
        customer_id,
        yclients_client_id,
        phone,
        company_id,
        miniapp_slug,
        yclients_record_id,
        yclients_visit_id,
        yclients_event_id,
        yclients_finance_operation_id,
        document_id,
        sold_item_id,
        sold_item_type,
        service_title,
        amount,
        source,
        status,
        happened_at,
        metadata
      )
      SELECT
        b.customer_id,
        NULLIF(e.json #>> '{data,client,id}', '')::int AS yclients_client_id,
        e.phone,
        e.company_id,
        m.slug AS miniapp_slug,
        CASE
          WHEN e.resource = 'finances_operation'
            THEN NULLIF(e.json #>> '{data,record_id}', '')::int
          ELSE e.resource_id
        END AS yclients_record_id,
        NULLIF(e.json #>> '{data,visit_id}', '')::int AS yclients_visit_id,
        e.id AS yclients_event_id,
        CASE
          WHEN e.resource = 'finances_operation' THEN e.resource_id
          ELSE NULL
        END AS yclients_finance_operation_id,
        NULLIF(e.json #>> '{data,document_id}', '')::int AS document_id,
        NULLIF(e.json #>> '{data,sold_item_id}', '')::int AS sold_item_id,
        COALESCE(NULLIF(e.json #>> '{data,sold_item_type}', ''), 'unknown') AS sold_item_type,
        NULL AS service_title,
        CASE
          WHEN e.resource = 'finances_operation' THEN e.amount
          ELSE NULL
        END AS amount,
        CASE
          WHEN e.resource = 'finances_operation' THEN 'payment'
          ELSE 'visit'
        END AS source,
        CASE
          WHEN e.resource = 'finances_operation' THEN 'payment_received'
          ELSE 'visit_completed'
        END AS status,
        e.date_created AS happened_at,
        jsonb_build_object(
          'yclients_event_name', e.event_name,
          'yclients_status', e.status,
          'raw_event_id', e.id,
          'backfill_match', 'booking_record_id'
        ) AS metadata
      FROM yclients_events e
      JOIN miniapp_bookings b
        ON b.yclients_record_id = CASE
          WHEN e.resource = 'finances_operation'
            THEN NULLIF(e.json #>> '{data,record_id}', '')::int
          ELSE e.resource_id
        END
      JOIN miniapps m
        ON m.id = b.miniapp_id
      WHERE (
          e.resource = 'record'
          AND e.status IN ('create', 'update')
          AND COALESCE((e.json #>> '{data,deleted}')::boolean, false) = false
          AND COALESCE(
            NULLIF(e.json #>> '{data,visit_attendance}', '')::int,
            NULLIF(e.json #>> '{data,attendance}', '')::int
          ) = 1
        )
        OR (
          e.resource = 'finances_operation'
          AND e.status IN ('create', 'update')
          AND COALESCE((e.json #>> '{data,deleted}')::boolean, false) = false
          AND e.amount > 0
        )
      ON CONFLICT DO NOTHING
    `);

  }

  public async down(): Promise<void> {
    // noop: revenue backfill cannot be safely reverted
  }
}
