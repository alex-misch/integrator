import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AnalyticsEvent} from './analytics-event.entity';
import {AnalyticsService} from './analytics.service';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, TelegramCustomer])],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
