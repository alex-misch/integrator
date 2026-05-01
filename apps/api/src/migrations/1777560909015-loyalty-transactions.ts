import {MigrationInterface, QueryRunner} from 'typeorm';

export class LoyaltyTransactions1777560909015 implements MigrationInterface {
  name = 'LoyaltyTransactions1777560909015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "yclients_events" ("id" BIGSERIAL NOT NULL, "phone" character varying NOT NULL, "event_name" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "company_id" integer, "processed" boolean NOT NULL DEFAULT false, "process_error" text, "date_processed" TIMESTAMP WITH TIME ZONE, "json" jsonb, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3e9a4cd9f847c5a500c4f3f797d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08c043c8149d6a20c25b1dd4c7" ON "yclients_events" ("event_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d921c74ec432e8a94c55799b1" ON "yclients_events" ("processed") `,
    );
    await queryRunner.query(
      `CREATE TABLE "loyalty_transactions" ("id" BIGSERIAL NOT NULL, "source" character varying NOT NULL, "customer_id" bigint NOT NULL, "referred_client_record_id" bigint, "yclients_event_id" bigint, "company_id" integer NOT NULL, "card_id" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "purchase_amount" numeric(12,2), "title" character varying, "metadata" jsonb, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_df453f678b7575221b335673362" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_805eec012403ffe27df8e315fa" ON "loyalty_transactions" ("source") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39f39219f9587d34638ccde8b6" ON "loyalty_transactions" ("customer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1622b4c1a939dd6d9cf19e8203" ON "loyalty_transactions" ("yclients_event_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_loyalty_transactions_referral_event_unique" ON "loyalty_transactions" ("yclients_event_id") WHERE "yclients_event_id" IS NOT NULL AND "source" = 'referral_payment_bonus'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_loyalty_transactions_referral_event_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1622b4c1a939dd6d9cf19e8203"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39f39219f9587d34638ccde8b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_805eec012403ffe27df8e315fa"`,
    );
    await queryRunner.query(`DROP TABLE "loyalty_transactions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d921c74ec432e8a94c55799b1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08c043c8149d6a20c25b1dd4c7"`,
    );
    await queryRunner.query(`DROP TABLE "yclients_events"`);
  }
}
