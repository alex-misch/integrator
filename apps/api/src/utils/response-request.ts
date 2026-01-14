import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsNumberString} from 'class-validator';

export class ApiOkResponse {
  status: true;
  message: string;
}

export class PaginationRequest {
  @ApiPropertyOptional({type: Number})
  @IsNumberString()
  offset: number;

  @ApiPropertyOptional({type: Number})
  @IsNumberString()
  limit: number;
}
