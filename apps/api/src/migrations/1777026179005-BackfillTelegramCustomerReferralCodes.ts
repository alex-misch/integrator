import {MigrationInterface, QueryRunner} from 'typeorm';

export class BackfillTelegramCustomerReferralCodes1777026179005
  implements MigrationInterface
{
  name = 'BackfillTelegramCustomerReferralCodes1777026179005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "telegram-customer"
      SET "referral_code" = substring(md5("id"::text || ':' || clock_timestamp()::text), 1, 16)
      WHERE "referral_code" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "telegram-customer"
      SET "referral_code" = NULL
    `);
  }
}
