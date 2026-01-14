import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {ApiProperty} from '@nestjs/swagger';
import {Miniapp} from './miniapp.entity';
import {MiniappService} from './miniapp-service.entity';
import {MiniappSpecialist} from './miniapp-specialist.entity';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';

export enum MiniappBookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Canceled = 'canceled',
  Completed = 'completed',
}

@Entity('miniapp_bookings')
export class MiniappBooking {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @ApiProperty()
  id: number;

  @ManyToOne(() => Miniapp, miniapp => miniapp.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: 'miniapp_id'})
  miniapp: Miniapp;

  @ManyToOne(() => TelegramCustomer, {nullable: false})
  @JoinColumn({name: 'customer_id'})
  customer: TelegramCustomer;

  @Column({type: 'date'})
  @ApiProperty({example: '2025-01-31'})
  date: string;

  @Column({type: 'time'})
  @ApiProperty({example: '10:00'})
  time: string;

  @Column({type: 'varchar', length: 32, default: MiniappBookingStatus.Pending})
  @ApiProperty({enum: MiniappBookingStatus})
  status: MiniappBookingStatus;

  @ManyToOne(() => MiniappService, {nullable: false})
  @JoinColumn({name: 'service_id'})
  service: MiniappService;

  @ManyToOne(() => MiniappSpecialist, {nullable: true})
  @JoinColumn({name: 'specialist_id'})
  specialist: MiniappSpecialist | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
