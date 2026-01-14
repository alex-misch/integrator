import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

@Entity('telegram-customer')
export class TelegramCustomer {
  @PrimaryColumn({type: 'bigint'})
  @ApiProperty({
    example: '123',
    description: 'ID from telegram',
  })
  @IsString()
  @IsNotEmpty()
  id: number;

  @Column()
  @ApiProperty({type: Boolean})
  is_bot: boolean;

  @Column({default: false})
  @ApiProperty({type: Boolean})
  is_blocked: boolean;

  @Column({type: 'varchar', nullable: true})
  @ApiProperty({type: String, nullable: true})
  first_name: string | null;

  @ApiProperty({type: String, nullable: true})
  @Column({type: 'varchar', nullable: true})
  last_name: string | null;

  @ApiProperty({type: String, nullable: true})
  @Column({type: 'varchar', nullable: true})
  username: string | null;

  @ApiProperty({example: 123456, nullable: true})
  @Column({type: 'int', nullable: true})
  yclients_id: number | null;

  @ApiProperty({type: String, nullable: true})
  @Column({type: 'varchar', nullable: true})
  language_code: string;

  @ApiProperty({type: String, nullable: true})
  @Column({type: 'varchar', nullable: true})
  photo_url: string;

  // Swagger
  @ApiProperty({
    example: '+79031111111',
    description: 'Phone of customer',
    type: String,
    nullable: true,
  })
  // TypeOrm
  @Column({type: 'varchar', length: '20', nullable: true})
  // Validation
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty({type: String, nullable: true})
  @Column({type: 'varchar', nullable: true})
  @Index()
  start_param: string;

  @ApiProperty({type: Date, nullable: true})
  @Column({nullable: true, type: 'timestamptz'})
  join_date: Date | null;

  @ApiProperty({description: 'Date of row creation'})
  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @ApiProperty({description: 'Date of last row update'})
  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
