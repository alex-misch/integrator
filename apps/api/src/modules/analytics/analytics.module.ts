import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AnalyticsEvent} from './analytics-event.entity';
import {AnalyticsService} from './analytics.service';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';
import {LoyaltyTransaction} from '../customer-loyalty/loyalty-transaction.entity';
import {MiniappBooking} from '../miniapp/miniapp-booking.entity';
import {MiniappClientRevenue} from './miniapp-client-revenue.entity';
import {MiniappClientRevenueService} from './miniapp-client-revenue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsEvent,
      TelegramCustomer,
      LoyaltyTransaction,
      MiniappBooking,
      MiniappClientRevenue,
    ]),
  ],
  providers: [AnalyticsService, MiniappClientRevenueService],
  exports: [AnalyticsService, MiniappClientRevenueService],
})
export class AnalyticsModule {}
