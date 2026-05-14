import { MigrationInterface, QueryRunner } from "typeorm";

export class Analytics1778742282729 implements MigrationInterface {
    name = 'Analytics1778742282729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "analytics_events" ("id" BIGSERIAL NOT NULL, "event_name" character varying NOT NULL, "miniapp_slug" character varying, "company_id" integer, "customer_id" bigint, "referrer_customer_id" bigint, "referral_code" character varying, "phone" character varying, "amount" numeric(12,2), "service_title" character varying, "resource" character varying, "resource_id" integer, "external_event_id" bigint, "metadata" jsonb, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5d643d67a09b55653e98616f421" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1bfdafcd2d2cf756138def6f38" ON "analytics_events" ("event_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_ebf477d0f1b826dd99b694b6a5" ON "analytics_events" ("miniapp_slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_1afb822f3e73256bf5d9fd1b83" ON "analytics_events" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b5f38fa29dba8f12fc00ba214e" ON "analytics_events" ("customer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5ad9d9501755b0c69f085afc5" ON "analytics_events" ("referrer_customer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_475bb541c8fceba16a2b75a712" ON "analytics_events" ("referral_code") `);
        await queryRunner.query(`CREATE INDEX "IDX_8fe6df7306a7ff6da88868a105" ON "analytics_events" ("resource_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a7493dd02a18acadda81dae0b" ON "analytics_events" ("external_event_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6a7493dd02a18acadda81dae0b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fe6df7306a7ff6da88868a105"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_475bb541c8fceba16a2b75a712"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5ad9d9501755b0c69f085afc5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5f38fa29dba8f12fc00ba214e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1afb822f3e73256bf5d9fd1b83"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebf477d0f1b826dd99b694b6a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1bfdafcd2d2cf756138def6f38"`);
        await queryRunner.query(`DROP TABLE "analytics_events"`);
    }

}
