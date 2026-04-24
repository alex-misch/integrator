import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsNumber, IsOptional, IsString, Min} from 'class-validator';

export class WalletCompanyQueryDto {
  @ApiProperty({example: 1714663})
  @Type(() => Number)
  @IsNumber()
  company_id: number;
}

export class WalletAmountDto extends WalletCompanyQueryDto {
  @ApiProperty({example: 100})
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({required: false, example: 'Manual topup'})
  @IsOptional()
  @IsString()
  title?: string;
}

export class WalletBalanceResponseDto {
  @ApiProperty({example: 1714663})
  company_id: number;

  @ApiProperty({example: 12345, nullable: true})
  yclients_client_id: number | null;

  @ApiProperty({example: 98765})
  card_id: number;

  @ApiProperty({example: '1234567890123'})
  card_number: string;

  @ApiProperty({example: 500})
  balance: number;

  @ApiProperty({example: 500})
  points: number;
}
