import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

const numberTransformer = {
  to(value?: number | null) {
    return value ?? null;
  },
  from(value?: string | number | null) {
    return value == null ? null : Number(value);
  },
};

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Index()
  @Column({type: 'varchar'})
  source: 'welcome_referral_bonus' | 'referral_payment_bonus';

  @Index()
  @Column({type: 'bigint'})
  customer_id: number;

  @Column({type: 'bigint', nullable: true})
  referred_client_record_id: number | null;

  @Index()
  @Column({type: 'bigint', nullable: true})
  yclients_event_id: number | null;

  @Column({type: 'int'})
  company_id: number;

  @Column({type: 'int'})
  card_id: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numberTransformer,
  })
  amount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numberTransformer,
  })
  purchase_amount: number | null;

  @Column({type: 'varchar', nullable: true})
  title: string | null;

  @Column({type: 'jsonb', nullable: true})
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;
}
