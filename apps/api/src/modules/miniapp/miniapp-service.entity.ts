import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean} from 'class-validator';
import {Miniapp} from './miniapp.entity';
import {MiniappSpecialist} from './miniapp-specialist.entity';
import {MiniappYclientsIntegration} from './miniapp-yclients.entity';

@Entity('miniapp_services')
export class MiniappService {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @ApiProperty({example: 1})
  id: number;

  @ManyToOne(() => Miniapp, miniapp => miniapp.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: 'miniapp_id'})
  miniapp: Miniapp;

  @ManyToOne(
    () => MiniappYclientsIntegration,
    integration => integration.services,
    {onDelete: 'CASCADE', onUpdate: 'CASCADE'},
  )
  @JoinColumn({name: 'integration_id'})
  integration: MiniappYclientsIntegration;

  @Column({type: 'varchar', length: 255})
  @ApiProperty({example: 'Удаление татуировки'})
  title: string;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 456, nullable: true})
  yclients_id: number | null;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 3500, nullable: true})
  price_min: number | null;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 5500, nullable: true})
  price_max: number | null;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 1800, nullable: true})
  duration_sec: number | null;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 1, nullable: true})
  service_type: number | null;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 10, nullable: true})
  weight: number | null;

  @Column({type: 'boolean', default: true})
  @ApiProperty({example: true})
  @IsBoolean()
  is_active: boolean;

  @Column({type: 'varchar', length: 64, nullable: true})
  @ApiProperty({example: 'от 3 500 ₽', nullable: true})
  price_text: string | null;

  @Column({type: 'varchar', length: 64, nullable: true})
  @ApiProperty({example: '30 мин', nullable: true})
  duration_text: string | null;

  @ManyToMany(() => MiniappSpecialist, specialist => specialist.services)
  @JoinTable({
    name: 'miniapp_service_specialists',
    joinColumn: {name: 'service_id', referencedColumnName: 'id'},
    inverseJoinColumn: {name: 'specialist_id', referencedColumnName: 'id'},
  })
  specialists: MiniappSpecialist[];

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
