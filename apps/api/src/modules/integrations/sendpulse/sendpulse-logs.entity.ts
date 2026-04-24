import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('sendpulse_logs')
export class SendpulseLog {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({type: 'jsonb', nullable: true})
  json: unknown | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @Column({type: 'boolean', default: false})
  processed: boolean;
}
