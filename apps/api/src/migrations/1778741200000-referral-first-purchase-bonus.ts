import {MigrationInterface, QueryRunner} from 'typeorm';

export class ReferralFirstPurchaseBonus1778741200000
  implements MigrationInterface
{
  name = 'ReferralFirstPurchaseBonus1778741200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_loyalty_transactions_referral_client_unique" ON "loyalty_transactions" ("referred_client_record_id") WHERE "referred_client_record_id" IS NOT NULL AND "source" = 'referral_payment_bonus' AND "metadata"->>'bonus_policy' = 'first_purchase_fixed_1000'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_loyalty_transactions_referral_client_unique"`,
    );
  }
}
