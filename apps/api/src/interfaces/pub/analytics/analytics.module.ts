import {Module} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {AnalyticsModule} from 'src/modules/analytics/analytics.module';
import {TelegramCustomerModule} from 'src/modules/telegram/telegram-customer.module';
import {AnalyticsPublicController} from './analytics.controller';

@Module({
  imports: [AnalyticsModule, TelegramCustomerModule],
  controllers: [AnalyticsPublicController],
  providers: [JwtService],
})
export class AnalyticsPublicModule {}
