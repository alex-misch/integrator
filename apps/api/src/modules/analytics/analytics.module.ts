import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AnalyticsEvent} from './analytics-event.entity';
import {AnalyticsService} from './analytics.service';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';
import {LoyaltyTransaction} from '../customer-loyalty/loyalty-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsEvent,
      TelegramCustomer,
      LoyaltyTransaction,
    ]),
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
