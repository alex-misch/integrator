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
  @ApiPropertyOptional({example: 1})
  @IsOptional()
  @IsNumber()
  service_id?: number;

  @ApiPropertyOptional({example: 2, nullable: true})
  @IsOptional()
  @IsNumber()
  specialist_id?: number | null;

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

export class MiniappBookDatesQueryDto {
  @ApiPropertyOptional({example: '2024-02-01'})
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({example: '2024-02-01'})
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({example: '2024-02-28'})
  @IsOptional()
  @IsString()
  dateTo?: string;
}

export class MiniappBookDatesDto {
  @ApiProperty({
    example: {'2026-02': ['2026-02-01', '2026-02-02']},
    type: 'object',
    additionalProperties: {type: 'array', items: {type: 'string'}},
  })
  booking_days: Record<string, string[]>;

  @ApiProperty({
    example: ['2026-05-02'],
    type: 'array',
    items: {oneOf: [{type: 'string'}, {type: 'number'}]},
  })
  booking_dates: Array<number | string>;

  @ApiProperty({
    example: {'2026-02': ['2026-02-01', '2026-02-02']},
    type: 'object',
    additionalProperties: {type: 'array', items: {type: 'string'}},
  })
  working_days: Record<string, string[]>;

  @ApiProperty({
    example: ['2026-05-02'],
    type: 'array',
    items: {oneOf: [{type: 'string'}, {type: 'number'}]},
  })
  working_dates: Array<number | string>;
}

export class MiniappUpdateBookingDto {
  @ApiProperty({example: '2024-02-01'})
  @IsString()
  date: string;

  @ApiProperty({example: '12:00'})
  @IsString()
  time: string;
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
