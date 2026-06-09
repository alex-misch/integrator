import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateMiniappClientRevenue1778744000000
  implements MigrationInterface
{
  name = 'CreateMiniappClientRevenue1778744000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "miniapp_client_revenue" (
        "id" BIGSERIAL PRIMARY KEY,
        "customer_id" BIGINT NULL,
        "yclients_client_id" INT NULL,
        "phone" VARCHAR NULL,
        "company_id" INT NULL,
        "miniapp_slug" VARCHAR NULL,
        "yclients_record_id" INT NULL,
        "yclients_visit_id" INT NULL,
        "yclients_event_id" BIGINT NULL,
        "yclients_finance_operation_id" INT NULL,
        "document_id" INT NULL,
        "sold_item_id" INT NULL,
        "sold_item_type" VARCHAR(64) NOT NULL DEFAULT 'unknown',
        "service_title" VARCHAR NULL,
        "amount" NUMERIC(12,2) NULL,
        "source" VARCHAR(64) NOT NULL,
        "status" VARCHAR(64) NOT NULL,
        "happened_at" TIMESTAMPTZ NOT NULL,
        "metadata" JSONB NULL,
        "date_created" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "date_updated" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_miniapp_client_revenue_yclients_event_unique"
      ON "miniapp_client_revenue" ("yclients_event_id")
      WHERE "yclients_event_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_miniapp_client_revenue_finance_operation_unique"
      ON "miniapp_client_revenue" ("yclients_finance_operation_id")
      WHERE "yclients_finance_operation_id" IS NOT NULL AND "source" = 'payment'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_miniapp_client_revenue_visit_record_unique"
      ON "miniapp_client_revenue" ("yclients_record_id")
      WHERE "yclients_record_id" IS NOT NULL AND "source" = 'visit'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_customer"
      ON "miniapp_client_revenue" ("customer_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_yclients_client"
      ON "miniapp_client_revenue" ("yclients_client_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_phone"
      ON "miniapp_client_revenue" ("phone")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_company"
      ON "miniapp_client_revenue" ("company_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_miniapp_slug"
      ON "miniapp_client_revenue" ("miniapp_slug")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_period"
      ON "miniapp_client_revenue" ("happened_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_source"
      ON "miniapp_client_revenue" ("source")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_record"
      ON "miniapp_client_revenue" ("yclients_record_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_miniapp_client_revenue_visit"
      ON "miniapp_client_revenue" ("yclients_visit_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "miniapp_client_revenue"`);
  }
}
