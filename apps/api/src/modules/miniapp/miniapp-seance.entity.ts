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

@Entity('miniapp_seances')
export class MiniappSeance {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @ApiProperty({example: 1})
  id: number;

  @ManyToOne(() => Miniapp, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'miniapp_id'})
  miniapp: Miniapp;

  @ManyToOne(() => MiniappService, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'service_id'})
  service: MiniappService;

  @ManyToOne(() => MiniappSpecialist, {nullable: true, onDelete: 'SET NULL'})
  @JoinColumn({name: 'specialist_id'})
  specialist: MiniappSpecialist | null;

  @Column({type: 'date'})
  @ApiProperty({example: '2024-02-01'})
  date: string;

  @Column({type: 'time'})
  @ApiProperty({example: '12:00'})
  time: string;

  @Column({type: 'varchar', length: 32})
  @ApiProperty({example: '2024-02-01T12:00:00+0300'})
  datetime: string;

  @Column({type: 'int'})
  @ApiProperty({example: 1800})
  seance_length: number;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
