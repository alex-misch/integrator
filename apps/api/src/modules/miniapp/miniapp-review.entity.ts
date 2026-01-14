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
import {DBFile} from '../files/files.entity';

@Entity('miniapp_reviews')
export class MiniappReview {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @ApiProperty({example: 1})
  id: number;

  @ManyToOne(() => Miniapp, miniapp => miniapp.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: 'miniapp_id'})
  miniapp: Miniapp;

  @Column({type: 'text'})
  @ApiProperty({example: 'Отличный сервис', description: 'Review text'})
  text: string;

  @Column({type: 'int'})
  @ApiProperty({example: 5, description: 'Rating'})
  rating: number;

  @Column({type: 'varchar', length: 255})
  @ApiProperty({example: 'Елена Громова', description: 'Author'})
  author: string;

  @ManyToOne(() => DBFile, {nullable: true})
  @JoinColumn({name: 'author_photo_id'})
  @ApiProperty({type: () => DBFile, nullable: true})
  author_photo: DBFile | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
