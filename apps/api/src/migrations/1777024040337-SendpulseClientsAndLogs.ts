import { MigrationInterface, QueryRunner } from "typeorm";

export class SendpulseClientsAndLogs1777024040337 implements MigrationInterface {
    name = 'SendpulseClientsAndLogs1777024040337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sendpulse_client" ("record_id" BIGSERIAL NOT NULL, "username" character varying, "telegram_id" bigint, "id" character varying, "tg_referrer" bigint, "phone" character varying, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c7d20c1ab2485e555b00c474eed" PRIMARY KEY ("record_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_89cd104ed3fd8efe9384a14310" ON "sendpulse_client" ("telegram_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3c475e3cc8e07c7cb0d25993b7" ON "sendpulse_client" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b173f369828ac6b22bc48d4ef9" ON "sendpulse_client" ("tg_referrer") `);
        await queryRunner.query(`CREATE TABLE "sendpulse_logs" ("id" BIGSERIAL NOT NULL, "json" jsonb, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "processed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_103cdcaae6dc86c164ee7e29a0f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sendpulse_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b173f369828ac6b22bc48d4ef9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c475e3cc8e07c7cb0d25993b7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89cd104ed3fd8efe9384a14310"`);
        await queryRunner.query(`DROP TABLE "sendpulse_client"`);
    }

}
