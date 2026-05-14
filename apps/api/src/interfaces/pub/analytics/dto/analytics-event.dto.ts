import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsIn, IsObject, IsOptional, IsString} from 'class-validator';

export class AnalyticsEventDto {
  @ApiProperty({enum: ['referral_share']})
  @IsIn(['referral_share'])
  event_name: 'referral_share';

  @ApiPropertyOptional({example: 'etlazer'})
  @IsOptional()
  @IsString()
  miniapp_slug?: string;

  @ApiPropertyOptional({type: Object})
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
