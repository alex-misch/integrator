import {Body, Controller, HttpCode, Post, Req} from '@nestjs/common';
import {ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {UseTelegramGuard} from 'src/decorators/UseTelegramGuard';
import {AnalyticsService} from 'src/modules/analytics/analytics.service';
import {TelegramCustomer} from 'src/modules/telegram/telegram-customer.entity';
import {AnalyticsEventDto} from './dto/analytics-event.dto';

@ApiTags('public-analytics')
@Controller('public/analytics')
export class AnalyticsPublicController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post()
  @HttpCode(200)
  @UseTelegramGuard()
  @ApiOperation({summary: 'Track miniapp analytics event'})
  @ApiOkResponse()
  async track(@Body() payload: AnalyticsEventDto, @Req() request) {
    await this.analytics.recordPublicEvent({
      eventName: payload.event_name,
      customer: request.customer as TelegramCustomer,
      companyId: null,
      miniappSlug: payload.miniapp_slug ?? null,
      metadata: payload.metadata ?? null,
    });

    return {status: 'ok'};
  }
}
