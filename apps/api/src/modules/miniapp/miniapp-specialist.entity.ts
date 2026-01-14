import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean} from 'class-validator';
import {Miniapp} from './miniapp.entity';
import {DBFile} from '../files/files.entity';
import {MiniappService} from './miniapp-service.entity';
import {MiniappYclientsIntegration} from './miniapp-yclients.entity';

@Entity('miniapp_specialists')
export class MiniappSpecialist {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @ApiProperty({example: 1})
  id: number;

  @ManyToOne(() => Miniapp, miniapp => miniapp.specialists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: 'miniapp_id'})
  miniapp: Miniapp;

  @ManyToOne(
    () => MiniappYclientsIntegration,
    integration => integration.specialists,
    {onDelete: 'CASCADE'},
  )
  @JoinColumn({name: 'integration_id'})
  integration: MiniappYclientsIntegration;

  @Column({type: 'varchar', length: 255})
  @ApiProperty({example: 'Екатерина Иванова'})
  name: string;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 123, nullable: true})
  yclients_id: number | null;

  @Column({type: 'varchar', length: 255, nullable: true})
  @ApiProperty({example: 'Лазерный терапевт', nullable: true})
  role: string | null;

  @Column({type: 'varchar', length: 512, nullable: true})
  @ApiProperty({
    example: 'https://images.yclients.com/staff/123.jpg',
    nullable: true,
  })
  photo_url: string | null;

  @Column({type: 'boolean', default: true})
  @ApiProperty({example: true})
  @IsBoolean()
  is_active: boolean;

  @ManyToOne(() => DBFile, {nullable: true})
  @JoinColumn({name: 'photo_id'})
  @ApiProperty({type: () => DBFile, nullable: true})
  photo: DBFile | null;

  @ManyToMany(() => MiniappService, service => service.specialists)
  services: MiniappService[];

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
