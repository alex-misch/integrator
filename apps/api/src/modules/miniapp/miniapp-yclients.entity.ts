import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsNumber, IsOptional, IsString} from 'class-validator';
import {Miniapp} from './miniapp.entity';
import {MiniappService} from './miniapp-service.entity';
import {MiniappSpecialist} from './miniapp-specialist.entity';

@Entity('miniapp_yclients_integrations')
export class MiniappYclientsIntegration {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @ApiProperty({example: 1})
  id: number;

  @ManyToOne(() => Miniapp, miniapp => miniapp.yclientsIntegrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: 'miniapp_id'})
  miniapp: Miniapp;

  @OneToMany(() => MiniappService, service => service.integration, {
    onDelete: 'CASCADE',
  })
  services: MiniappService[];

  @OneToMany(() => MiniappSpecialist, specialist => specialist.integration)
  specialists: MiniappSpecialist[];

  @Column({type: 'varchar', length: 512, nullable: true})
  @ApiProperty({example: 'Москва'})
  @IsString()
  city: string | null;

  @Column({type: 'varchar', length: 255, nullable: true})
  @ApiProperty({example: 'Россия', nullable: true})
  @IsOptional()
  @IsString()
  country: string | null;

  @Column({type: 'varchar', length: 512, nullable: true})
  @ApiProperty({example: 'Летниковская улица, 10с2', nullable: true})
  @IsOptional()
  @IsString()
  address_text: string | null;

  @Column({type: 'double precision', nullable: true})
  @ApiProperty({example: 55.75, nullable: true})
  @IsOptional()
  @IsNumber()
  lat: number | null;

  @Column({type: 'double precision', nullable: true})
  @ApiProperty({example: 37.62, nullable: true})
  @IsOptional()
  @IsNumber()
  lng: number | null;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 12345, nullable: true})
  @IsOptional()
  @IsNumber()
  company_id: number | null;

  @Column({type: 'boolean', default: false})
  @ApiProperty({example: true})
  @IsOptional()
  @IsBoolean()
  is_primary: boolean;

  @Column({type: 'varchar', length: 32, nullable: true})
  @ApiProperty({example: '+7 999 000-00-00', nullable: true})
  @IsOptional()
  @IsString()
  phone: string | null;

  @Column({type: 'varchar', length: 255, nullable: true})
  @ApiProperty({example: 'info@site.ru', nullable: true})
  @IsOptional()
  @IsString()
  email: string | null;

  @Column({type: 'varchar', length: 64, nullable: true})
  @ApiProperty({example: '@username', nullable: true})
  @IsOptional()
  @IsString()
  telegram: string | null;

  @Column({type: 'varchar', length: 64, nullable: true})
  @ApiProperty({example: '+7 999 000-00-00', nullable: true})
  @IsOptional()
  @IsString()
  whatsapp: string | null;

  @Column({type: 'varchar', length: 255, nullable: true})
  @ApiProperty({example: 'https://site.ru', nullable: true})
  @IsOptional()
  @IsString()
  website: string | null;

  @Column({type: 'int', nullable: true})
  @ApiProperty({example: 3, nullable: true})
  @IsOptional()
  @IsNumber()
  timezone: number | null;

  @Column({type: 'varchar', length: 64, nullable: true})
  @ApiProperty({example: 'Europe/Moscow', nullable: true})
  @IsOptional()
  @IsString()
  timezone_name: string | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
