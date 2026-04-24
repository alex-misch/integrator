import {Body, Controller, Get, Post, Query, Req} from '@nestjs/common';
import {ApiBody, ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {UseTelegramGuard} from 'src/decorators/UseTelegramGuard';
import {CustomerLoyaltyService} from 'src/modules/customer-loyalty/customer-loyalty.service';
import {
  WalletAmountDto,
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

  @Post('topup')
  @UseTelegramGuard()
  @ApiOperation({summary: 'Temporary method to top up loyalty balance'})
  @ApiBody({type: WalletAmountDto})
  @ApiOkResponse({type: WalletBalanceResponseDto})
  async topup(
    @Req() request,
    @Body() payload: WalletAmountDto,
  ): Promise<WalletBalanceResponseDto> {
    return this.loyalty.topup(
      Number(request.customer.id),
      payload.company_id,
      payload.amount,
      payload.title,
    );
  }

  @Post('spend')
  @UseTelegramGuard()
  @ApiOperation({summary: 'Temporary method to spend loyalty balance'})
  @ApiBody({type: WalletAmountDto})
  @ApiOkResponse({type: WalletBalanceResponseDto})
  async spend(
    @Req() request,
    @Body() payload: WalletAmountDto,
  ): Promise<WalletBalanceResponseDto> {
    return this.loyalty.spend(
      Number(request.customer.id),
      payload.company_id,
      payload.amount,
      payload.title,
    );
  }
}
