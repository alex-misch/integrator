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

@Index('IDX_yclients_events_payment_unique', ['resource_id'], {
  unique: true,
  where: `"resource_id" IS NOT NULL AND "event_name" = 'payment'`,
})
@Entity('yclients_events')
export class YclientsEvent {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({type: 'varchar'})
  phone: string;

  @Index()
  @Column({type: 'varchar'})
  event_name: string;

  @Column({type: 'varchar', nullable: true})
  resource: string | null;

  @Index()
  @Column({type: 'int', nullable: true})
  resource_id: number | null;

  @Column({type: 'varchar', nullable: true})
  status: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numberTransformer,
  })
  amount: number;

  @Column({type: 'int', nullable: true})
  company_id: number | null;

  @Index()
  @Column({default: false})
  processed: boolean;

  @Column({type: 'text', nullable: true})
  process_error: string | null;

  @Column({type: 'timestamptz', nullable: true})
  date_processed: Date | null;

  @Column({type: 'jsonb', nullable: true})
  json: Record<string, unknown> | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
