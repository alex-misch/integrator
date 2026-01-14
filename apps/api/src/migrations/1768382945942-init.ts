import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1768382945942 implements MigrationInterface {
    name = 'Init1768382945942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "telegram_logs" ("id" BIGSERIAL NOT NULL, "telegramId" bigint NOT NULL, "action" character varying(50) NOT NULL, "description" character varying(225), "dateCreated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e63d1e7f6b993ac72e392634967" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rate_limit" ("key" text NOT NULL, "throttler_name" text NOT NULL, "hits" bigint array NOT NULL DEFAULT '{}', "blocked_until" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_bb65a28599e287b4f63de807390" PRIMARY KEY ("key", "throttler_name"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bb65a28599e287b4f63de80739" ON "rate_limit" ("key", "throttler_name") `);
        await queryRunner.query(`CREATE TABLE "telegram-customer" ("id" bigint NOT NULL, "is_bot" boolean NOT NULL, "is_blocked" boolean NOT NULL DEFAULT false, "first_name" character varying, "last_name" character varying, "username" character varying, "yclients_id" integer, "language_code" character varying, "photo_url" character varying, "phone" character varying(20), "start_param" character varying, "join_date" TIMESTAMP WITH TIME ZONE, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e80065c8f6c9656443dcb0ce469" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_431f688d1effe90cb100aeacbe" ON "telegram-customer" ("start_param") `);
        await queryRunner.query(`CREATE TABLE "files" ("id" BIGSERIAL NOT NULL, "mime_type" character varying(255) NOT NULL, "url" character varying(255) NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "miniapp_reviews" ("id" BIGSERIAL NOT NULL, "text" text NOT NULL, "rating" integer NOT NULL, "author" character varying(255) NOT NULL, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "miniapp_id" bigint, "author_photo_id" bigint, CONSTRAINT "PK_c22c34ef4fdad09a522efcbeef7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "miniapp_yclients_integrations" ("id" BIGSERIAL NOT NULL, "city" character varying(512), "country" character varying(255), "address_text" character varying(512), "lat" double precision, "lng" double precision, "company_id" integer, "is_primary" boolean NOT NULL DEFAULT false, "phone" character varying(32), "email" character varying(255), "telegram" character varying(64), "whatsapp" character varying(64), "website" character varying(255), "timezone" integer, "timezone_name" character varying(64), "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "miniapp_id" bigint, CONSTRAINT "PK_0886aa9805be34171b726cdc0d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "miniapp_specialists" ("id" BIGSERIAL NOT NULL, "name" character varying(255) NOT NULL, "yclients_id" integer, "role" character varying(255), "photo_url" character varying(512), "is_active" boolean NOT NULL DEFAULT true, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "miniapp_id" bigint, "integration_id" bigint, "photo_id" bigint, CONSTRAINT "PK_7842df30108cc87175a1925fff4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "miniapp_services" ("id" BIGSERIAL NOT NULL, "title" character varying(255) NOT NULL, "yclients_id" integer, "price_min" integer, "price_max" integer, "duration_sec" integer, "service_type" integer, "weight" integer, "is_active" boolean NOT NULL DEFAULT true, "price_text" character varying(64), "duration_text" character varying(64), "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "miniapp_id" bigint, "integration_id" bigint, CONSTRAINT "PK_03e47f6c922e2993baecb5cf911" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "miniapp_bookings" ("id" BIGSERIAL NOT NULL, "date" date NOT NULL, "time" TIME NOT NULL, "status" character varying(32) NOT NULL DEFAULT 'pending', "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "miniapp_id" bigint, "customer_id" bigint NOT NULL, "service_id" bigint NOT NULL, "specialist_id" bigint, CONSTRAINT "PK_af0de976f73d5f3cabc1ad46ccf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "miniapps" ("id" BIGSERIAL NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(64) NOT NULL, "telegram_bot_token" character varying(255), "logo_url" character varying(512), "title" character varying(255), "public_title" character varying(255), "short_descr" character varying(512), "description" text, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_382080dd7672062aca5c5ec0d3c" UNIQUE ("slug"), CONSTRAINT "PK_5be6b429f78412407fd6b9c8746" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "miniapp_seances" ("id" BIGSERIAL NOT NULL, "date" date NOT NULL, "time" TIME NOT NULL, "datetime" character varying(32) NOT NULL, "seance_length" integer NOT NULL, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "miniapp_id" bigint, "service_id" bigint, "specialist_id" bigint, CONSTRAINT "PK_4b902b9670a3ed7c8befe0a1e53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "manager" ("id" SERIAL NOT NULL, "login" character varying(20) NOT NULL, "name" character varying(100) NOT NULL, "email" character varying, "password" character varying(150) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_last_active" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_ac62bd75ae1407479bcf567642d" UNIQUE ("login"), CONSTRAINT "UQ_ee8fba4edb704ce2465753a2edd" UNIQUE ("email"), CONSTRAINT "PK_b3ac840005ee4ed76a7f1c51d01" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "miniapp_service_specialists" ("service_id" bigint NOT NULL, "specialist_id" bigint NOT NULL, CONSTRAINT "PK_5d7cc17b4f4417e1b0792795d02" PRIMARY KEY ("service_id", "specialist_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4e636d426bc7185b3649c6bbf7" ON "miniapp_service_specialists" ("service_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e00eb7723acab20fe23bedd75b" ON "miniapp_service_specialists" ("specialist_id") `);
        await queryRunner.query(`CREATE TABLE "miniapp_photos" ("miniappsId" bigint NOT NULL, "filesId" bigint NOT NULL, CONSTRAINT "PK_ca90c3581af1d573c08db571dec" PRIMARY KEY ("miniappsId", "filesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_227f2c0c664faa71ffec0451ff" ON "miniapp_photos" ("miniappsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b7d4cfa8f8784e606b98266fed" ON "miniapp_photos" ("filesId") `);
        await queryRunner.query(`ALTER TABLE "miniapp_reviews" ADD CONSTRAINT "FK_d18465206c4a8d21592df6af7d9" FOREIGN KEY ("miniapp_id") REFERENCES "miniapps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_reviews" ADD CONSTRAINT "FK_c167acbfd661165a3a4b41372ec" FOREIGN KEY ("author_photo_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_yclients_integrations" ADD CONSTRAINT "FK_17149f28891b4b88681c4aaad83" FOREIGN KEY ("miniapp_id") REFERENCES "miniapps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_specialists" ADD CONSTRAINT "FK_eb48f21fb7bc6aaf2d0aa69abff" FOREIGN KEY ("miniapp_id") REFERENCES "miniapps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_specialists" ADD CONSTRAINT "FK_2823639f2e3922fd5543f70abd9" FOREIGN KEY ("integration_id") REFERENCES "miniapp_yclients_integrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_specialists" ADD CONSTRAINT "FK_7950d2aa3daccf7ccd7b97777af" FOREIGN KEY ("photo_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_services" ADD CONSTRAINT "FK_65f9cdb2d3673a8620f25bdc4c7" FOREIGN KEY ("miniapp_id") REFERENCES "miniapps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_services" ADD CONSTRAINT "FK_50213449be968b6392bf14922a9" FOREIGN KEY ("integration_id") REFERENCES "miniapp_yclients_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "miniapp_bookings" ADD CONSTRAINT "FK_e886a638177b84268f04eeef8a8" FOREIGN KEY ("miniapp_id") REFERENCES "miniapps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_bookings" ADD CONSTRAINT "FK_83ca8500fa7ef3d6068dd02d0c7" FOREIGN KEY ("customer_id") REFERENCES "telegram-customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_bookings" ADD CONSTRAINT "FK_9d187aebfbf8df83bd233e02a44" FOREIGN KEY ("service_id") REFERENCES "miniapp_services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_bookings" ADD CONSTRAINT "FK_074b5240ee4a1552d6747208ab0" FOREIGN KEY ("specialist_id") REFERENCES "miniapp_specialists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_seances" ADD CONSTRAINT "FK_af0683b9ed144cf7f3d205a9147" FOREIGN KEY ("miniapp_id") REFERENCES "miniapps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_seances" ADD CONSTRAINT "FK_3bc241105152182cbd6527b608d" FOREIGN KEY ("service_id") REFERENCES "miniapp_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_seances" ADD CONSTRAINT "FK_efcf2ae804c6dee1fb18ea633af" FOREIGN KEY ("specialist_id") REFERENCES "miniapp_specialists"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_service_specialists" ADD CONSTRAINT "FK_4e636d426bc7185b3649c6bbf78" FOREIGN KEY ("service_id") REFERENCES "miniapp_services"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "miniapp_service_specialists" ADD CONSTRAINT "FK_e00eb7723acab20fe23bedd75b7" FOREIGN KEY ("specialist_id") REFERENCES "miniapp_specialists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "miniapp_photos" ADD CONSTRAINT "FK_227f2c0c664faa71ffec0451ffa" FOREIGN KEY ("miniappsId") REFERENCES "miniapps"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "miniapp_photos" ADD CONSTRAINT "FK_b7d4cfa8f8784e606b98266fed3" FOREIGN KEY ("filesId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "miniapp_photos" DROP CONSTRAINT "FK_b7d4cfa8f8784e606b98266fed3"`);
        await queryRunner.query(`ALTER TABLE "miniapp_photos" DROP CONSTRAINT "FK_227f2c0c664faa71ffec0451ffa"`);
        await queryRunner.query(`ALTER TABLE "miniapp_service_specialists" DROP CONSTRAINT "FK_e00eb7723acab20fe23bedd75b7"`);
        await queryRunner.query(`ALTER TABLE "miniapp_service_specialists" DROP CONSTRAINT "FK_4e636d426bc7185b3649c6bbf78"`);
        await queryRunner.query(`ALTER TABLE "miniapp_seances" DROP CONSTRAINT "FK_efcf2ae804c6dee1fb18ea633af"`);
        await queryRunner.query(`ALTER TABLE "miniapp_seances" DROP CONSTRAINT "FK_3bc241105152182cbd6527b608d"`);
        await queryRunner.query(`ALTER TABLE "miniapp_seances" DROP CONSTRAINT "FK_af0683b9ed144cf7f3d205a9147"`);
        await queryRunner.query(`ALTER TABLE "miniapp_bookings" DROP CONSTRAINT "FK_074b5240ee4a1552d6747208ab0"`);
        await queryRunner.query(`ALTER TABLE "miniapp_bookings" DROP CONSTRAINT "FK_9d187aebfbf8df83bd233e02a44"`);
        await queryRunner.query(`ALTER TABLE "miniapp_bookings" DROP CONSTRAINT "FK_83ca8500fa7ef3d6068dd02d0c7"`);
        await queryRunner.query(`ALTER TABLE "miniapp_bookings" DROP CONSTRAINT "FK_e886a638177b84268f04eeef8a8"`);
        await queryRunner.query(`ALTER TABLE "miniapp_services" DROP CONSTRAINT "FK_50213449be968b6392bf14922a9"`);
        await queryRunner.query(`ALTER TABLE "miniapp_services" DROP CONSTRAINT "FK_65f9cdb2d3673a8620f25bdc4c7"`);
        await queryRunner.query(`ALTER TABLE "miniapp_specialists" DROP CONSTRAINT "FK_7950d2aa3daccf7ccd7b97777af"`);
        await queryRunner.query(`ALTER TABLE "miniapp_specialists" DROP CONSTRAINT "FK_2823639f2e3922fd5543f70abd9"`);
        await queryRunner.query(`ALTER TABLE "miniapp_specialists" DROP CONSTRAINT "FK_eb48f21fb7bc6aaf2d0aa69abff"`);
        await queryRunner.query(`ALTER TABLE "miniapp_yclients_integrations" DROP CONSTRAINT "FK_17149f28891b4b88681c4aaad83"`);
        await queryRunner.query(`ALTER TABLE "miniapp_reviews" DROP CONSTRAINT "FK_c167acbfd661165a3a4b41372ec"`);
        await queryRunner.query(`ALTER TABLE "miniapp_reviews" DROP CONSTRAINT "FK_d18465206c4a8d21592df6af7d9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b7d4cfa8f8784e606b98266fed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_227f2c0c664faa71ffec0451ff"`);
        await queryRunner.query(`DROP TABLE "miniapp_photos"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e00eb7723acab20fe23bedd75b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e636d426bc7185b3649c6bbf7"`);
        await queryRunner.query(`DROP TABLE "miniapp_service_specialists"`);
        await queryRunner.query(`DROP TABLE "manager"`);
        await queryRunner.query(`DROP TABLE "miniapp_seances"`);
        await queryRunner.query(`DROP TABLE "miniapps"`);
        await queryRunner.query(`DROP TABLE "miniapp_bookings"`);
        await queryRunner.query(`DROP TABLE "miniapp_services"`);
        await queryRunner.query(`DROP TABLE "miniapp_specialists"`);
        await queryRunner.query(`DROP TABLE "miniapp_yclients_integrations"`);
        await queryRunner.query(`DROP TABLE "miniapp_reviews"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_431f688d1effe90cb100aeacbe"`);
        await queryRunner.query(`DROP TABLE "telegram-customer"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb65a28599e287b4f63de80739"`);
        await queryRunner.query(`DROP TABLE "rate_limit"`);
        await queryRunner.query(`DROP TABLE "telegram_logs"`);
    }

}
