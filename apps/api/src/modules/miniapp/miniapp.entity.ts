import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import {ApiProperty} from '@nestjs/swagger';
import {DBFile} from '../files/files.entity';
import {MiniappReview} from './miniapp-review.entity';
import {MiniappService} from './miniapp-service.entity';
import {MiniappSpecialist} from './miniapp-specialist.entity';
import {MiniappBooking} from './miniapp-booking.entity';
import {MiniappYclientsIntegration} from './miniapp-yclients.entity';
import {IsOptional, IsString} from 'class-validator';

@Entity('miniapps')
export class Miniapp {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @ApiProperty({example: 1, description: 'Miniapp identifier'})
  id: number;

  @Column({type: 'varchar', length: 255})
  @ApiProperty({example: 'ET.Lazer', description: 'Miniapp name'})
  @IsString()
  name: string;

  @Column({type: 'varchar', length: 64, unique: true})
  @ApiProperty({example: 'etlazer', description: 'Miniapp slug'})
  @IsString()
  slug: string;

  @Column({type: 'varchar', length: 255, nullable: true})
  @ApiProperty({example: '123456:ABC-DEF'})
  @IsOptional()
  @IsString()
  telegram_bot_token: string;

  @Column({type: 'varchar', length: 512, nullable: true})
  @ApiProperty({
    example: 'https://be.cdn.yclients.com/images/yclients-default-logo.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  logo_url: string | null;

  @Column({type: 'varchar', length: 255, nullable: true})
  @ApiProperty({example: 'Дисфуксия', nullable: true})
  @IsOptional()
  @IsString()
  title: string | null;

  @Column({type: 'varchar', length: 255, nullable: true})
  @ApiProperty({example: 'Дисфуксия', nullable: true})
  @IsOptional()
  @IsString()
  public_title: string | null;

  @Column({type: 'varchar', length: 512, nullable: true})
  @ApiProperty({example: 'Салон красоты', nullable: true})
  @IsOptional()
  @IsString()
  short_descr: string | null;

  @Column({type: 'text', nullable: true})
  @ApiProperty({example: 'Описание', nullable: true})
  @IsOptional()
  @IsString()
  description: string | null;

  @ManyToMany(() => DBFile, {cascade: false})
  @JoinTable({name: 'miniapp_photos'})
  @ApiProperty({type: () => [DBFile]})
  photos: DBFile[];

  @OneToMany(
    () => MiniappYclientsIntegration,
    integration => integration.miniapp,
  )
  yclientsIntegrations: MiniappYclientsIntegration[];

  @OneToMany(() => MiniappReview, review => review.miniapp)
  reviews: MiniappReview[];

  @OneToMany(() => MiniappService, service => service.miniapp)
  services: MiniappService[];

  @OneToMany(() => MiniappSpecialist, specialist => specialist.miniapp)
  specialists: MiniappSpecialist[];

  @OneToMany(() => MiniappBooking, booking => booking.miniapp)
  bookings: MiniappBooking[];

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
