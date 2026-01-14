import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsIn,
  IsNumberString,
  IsNumber,
} from 'class-validator';
import {
  MiniappPublicServiceDto,
  MiniappPublicSpecialistDto,
} from './miniapp-public.dto';
import {MiniappBookingStatus} from '../../../../modules/miniapp/miniapp-booking.entity';

export class MiniappCreateRecordDto {
  @ApiProperty({example: 1})
  @IsNumber()
  service_id: number;

  @ApiProperty({example: 2, nullable: true})
  @IsNumber()
  specialist_id: number | null;

  @ApiProperty({example: '2024-02-01'})
  @IsString()
  date: string;

  @ApiProperty({example: '12:00'})
  @IsString()
  time: string;

  @ApiProperty({example: 'Иван Иванов'})
  @IsString()
  client_name: string;

  @ApiProperty({example: '+7 999 000-00-00'})
  @IsString()
  client_phone: string;

  @ApiProperty({example: 'client@mail.ru', nullable: true})
  @IsString()
  client_email?: string | null;

  @ApiProperty({example: 'Комментарий', nullable: true})
  @IsString()
  comment?: string | null;
}

export class MiniappRecordsQueryDto {
  @ApiPropertyOptional({example: '2024-02-01'})
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({example: 1})
  @IsOptional()
  @IsNumberString()
  serviceId?: string;

  @ApiPropertyOptional({example: 2})
  @IsOptional()
  @IsNumberString()
  specialistId?: string;

  @ApiPropertyOptional({example: '1'})
  @IsOptional()
  @IsIn(['1', 'true'])
  mine?: string;
}

export class MiniappPublicBookingDto {
  @ApiProperty({example: 1})
  id: number;

  @ApiProperty({example: '2025-01-31'})
  date: string;

  @ApiProperty({example: '10:00'})
  time: string;

  @ApiProperty({enum: MiniappBookingStatus})
  status: MiniappBookingStatus;

  @ApiProperty({type: MiniappPublicServiceDto})
  service: MiniappPublicServiceDto;

  @ApiProperty({type: MiniappPublicSpecialistDto, nullable: true})
  specialist: MiniappPublicSpecialistDto | null;
}
