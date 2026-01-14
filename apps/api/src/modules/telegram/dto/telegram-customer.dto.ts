import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsNumber, IsOptional, IsString} from 'class-validator';

export class VerifyCustomerDto {
  @ApiProperty({
    example:
      'query_id=AAGq6gUJAAAAAKrqBQnd1HtW&user=%7B%22id%22%3A151382698%2C%22first_name%22%3A%22Aleksandr...&hash=***',
    description: 'The initData from telegram',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  initData: string;

  @ApiProperty({
    example: 'qBQnd1H',
    description: 'Uniq code of referal',
    required: false,
  })
  @IsString()
  @IsOptional()
  startParam?: string;

  @ApiProperty({
    example: 1714663,
    description: 'Miniapp integration company id',
    required: true,
  })
  @IsNumber()
  company_id: number;
}
