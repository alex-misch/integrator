import {Controller, Get, Query, Req} from '@nestjs/common';
import {ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {UseTelegramGuard} from 'src/decorators/UseTelegramGuard';
import {CustomerLoyaltyService} from 'src/modules/customer-loyalty/customer-loyalty.service';
import {
  WalletBalanceResponseDto,
  WalletCompanyQueryDto,
} from './dto/wallet.dto';

@ApiTags('public-wallet')
@Controller('public/wallet')
export class WalletPublicController {
  constructor(private readonly loyalty: CustomerLoyaltyService) {}

  @Get('balance')
  @UseTelegramGuard()
  @ApiOperation({summary: 'Get customer loyalty balance'})
  @ApiOkResponse({type: WalletBalanceResponseDto})
  async balance(
    @Req() request,
    @Query() query: WalletCompanyQueryDto,
  ): Promise<WalletBalanceResponseDto> {
    return this.loyalty.getBalance(
      Number(request.customer.id),
      query.company_id,
    );
  }
}
