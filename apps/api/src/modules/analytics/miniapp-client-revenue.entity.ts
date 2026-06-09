import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const numberTransformer = {
  to(value?: number | null) {
    return value ?? null;
  },
  from(value?: string | number | null) {
    return value == null ? null : Number(value);
  },
};

export enum MiniappClientRevenueStatus {
  VisitCompleted = 'visit_completed',
  PaymentReceived = 'payment_received',
}

export enum MiniappClientRevenueItemType {
  Service = 'service',
  GoodsTransaction = 'goods_transaction',
  Unknown = 'unknown',
}

@Index(
  'IDX_miniapp_client_revenue_yclients_event_unique',
  ['yclients_event_id'],
  {
    unique: true,
    where: `"yclients_event_id" IS NOT NULL`,
  },
)
@Index(
  'IDX_miniapp_client_revenue_finance_operation_unique',
  ['yclients_finance_operation_id'],
  {
    unique: true,
    where: `"yclients_finance_operation_id" IS NOT NULL AND "source" = 'payment'`,
  },
)
@Index(
  'IDX_miniapp_client_revenue_visit_record_unique',
  ['yclients_record_id'],
  {
    unique: true,
    where: `"yclients_record_id" IS NOT NULL AND "source" = 'visit'`,
  },
)
@Entity('miniapp_client_revenue')
export class MiniappClientRevenue {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Index()
  @Column({type: 'bigint', nullable: true})
  customer_id: number | null;

  @Index()
  @Column({type: 'int', nullable: true})
  yclients_client_id: number | null;

  @Index()
  @Column({type: 'varchar', nullable: true})
  phone: string | null;

  @Index()
  @Column({type: 'int', nullable: true})
  company_id: number | null;

  @Index()
  @Column({type: 'varchar', nullable: true})
  miniapp_slug: string | null;

  @Index()
  @Column({type: 'int', nullable: true})
  yclients_record_id: number | null;

  @Index()
  @Column({type: 'int', nullable: true})
  yclients_visit_id: number | null;

  @Index()
  @Column({type: 'bigint', nullable: true})
  yclients_event_id: number | null;

  @Index()
  @Column({type: 'int', nullable: true})
  yclients_finance_operation_id: number | null;

  @Column({type: 'int', nullable: true})
  document_id: number | null;

  @Column({type: 'int', nullable: true})
  sold_item_id: number | null;

  @Column({
    type: 'varchar',
    length: 64,
    default: MiniappClientRevenueItemType.Unknown,
  })
  sold_item_type: MiniappClientRevenueItemType;

  @Column({type: 'varchar', nullable: true})
  service_title: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numberTransformer,
  })
  amount: number | null;

  @Column({type: 'varchar', length: 64})
  source: 'visit' | 'payment';

  @Column({type: 'varchar', length: 64})
  status: MiniappClientRevenueStatus;

  @Column({type: 'timestamptz'})
  happened_at: Date;

  @Column({type: 'jsonb', nullable: true})
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
