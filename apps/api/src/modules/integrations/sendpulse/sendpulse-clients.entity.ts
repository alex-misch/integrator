import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sendpulse_client')
export class SendpulseClient {
  @PrimaryGeneratedColumn({type: 'bigint'})
  record_id: number;

  @Column({type: 'varchar', nullable: true})
  username: string | null;

  @Index()
  @Column({type: 'bigint', nullable: true})
  telegram_id: string | null;

  @Index()
  @Column({type: 'varchar', nullable: true})
  id: string | null;

  @Index()
  @Column({type: 'bigint', nullable: true})
  tg_referrer: string | null;

  @Column({type: 'varchar', nullable: true})
  phone: string | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
