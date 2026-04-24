import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTelegramCustomerReferralCode1777025916172 implements MigrationInterface {
    name = 'AddTelegramCustomerReferralCode1777025916172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telegram-customer" ADD "referral_code" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_21bb28e040adc2cc9a549c5ec6" ON "telegram-customer" ("referral_code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_21bb28e040adc2cc9a549c5ec6"`);
        await queryRunner.query(`ALTER TABLE "telegram-customer" DROP COLUMN "referral_code"`);
    }

}
