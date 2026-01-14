import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {ApiProperty} from '@nestjs/swagger';
import {IsString, IsDate, IsBoolean} from 'class-validator';

@Entity('files')
export class DBFile {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @ApiProperty({example: '154', description: 'Unique file identifier'})
  id: number;

  @Column({type: 'varchar', length: 255})
  @ApiProperty({example: 'image/png', description: 'File mime type'})
  @IsString()
  mime_type: string;

  @Column({type: 'varchar', length: 255})
  @ApiProperty({
    example: 'https://cdn.emomap.online/uploads/file.png',
    description: 'File url',
  })
  @IsString()
  url: string;

  @Column({default: false})
  @ApiProperty({example: false, description: 'Is file deleted'})
  @IsBoolean()
  is_deleted: boolean;

  @CreateDateColumn({type: 'timestamptz'})
  @ApiProperty({
    example: '2024-10-05T07:27:32.131Z',
    description: 'Date when file was created',
  })
  @IsDate()
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  @ApiProperty({
    example: '2024-10-06T07:27:32.131Z',
    description: 'Date when file was updated',
  })
  @IsDate()
  date_updated: Date;
}
