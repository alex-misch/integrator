import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@Entity('telegram_logs')
export class TelegramLogs {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  @ApiProperty({ description: 'ID of log record' })
  id: number;

  @Column({ type: 'bigint' })
  @ApiProperty({
    example: '123',
    description: 'ID from telegram',
  })
  @IsString()
  @IsNotEmpty()
  telegramId: number;

  @Column({ type: 'varchar', length: '50' })
  action: string;

  @Column({ type: 'varchar', length: '225', nullable: true })
  description: string;

  @ApiProperty({ description: 'Date of row creation' })
  @CreateDateColumn({ type: 'timestamptz' })
  dateCreated: Date;
}
