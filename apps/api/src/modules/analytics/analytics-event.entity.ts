import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AnalyticsEventName =
  | 'visit'
  | 'referral_share'
  | 'referral_open'
  | 'referral_booking'
  | 'referral_payment';

const numberTransformer = {
  to(value?: number | null) {
    return value ?? null;
  },
  from(value?: string | number | null) {
    return value == null ? null : Number(value);
  },
};

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Index()
  @Column({type: 'varchar'})
  event_name: AnalyticsEventName;

  @Index()
  @Column({type: 'varchar', nullable: true})
  miniapp_slug: string | null;

  @Index()
  @Column({type: 'int', nullable: true})
  company_id: number | null;

  @Index()
  @Column({type: 'bigint', nullable: true})
  customer_id: string | null;

  @Index()
  @Column({type: 'bigint', nullable: true})
  referrer_customer_id: string | null;

  @Index()
  @Column({type: 'varchar', nullable: true})
  referral_code: string | null;

  @Column({type: 'varchar', nullable: true})
  phone: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numberTransformer,
  })
  amount: number | null;

  @Column({type: 'varchar', nullable: true})
  service_title: string | null;

  @Column({type: 'varchar', nullable: true})
  resource: string | null;

  @Index()
  @Column({type: 'int', nullable: true})
  resource_id: number | null;

  @Index()
  @Column({type: 'bigint', nullable: true})
  external_event_id: string | null;

  @Column({type: 'jsonb', nullable: true})
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
