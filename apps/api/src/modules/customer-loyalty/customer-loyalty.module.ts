import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CustomerLoyaltyService} from './customer-loyalty.service';
import {TelegramCustomerModule} from '../telegram/telegram-customer.module';
import {YclientsClient} from '../integrations/yclients/yclients.service';
import {SendpulseModule} from '../integrations/sendpulse/sendpulse.module';
import {LoyaltyTransaction} from './loyalty-transaction.entity';
import {YclientsEvent} from './yclients-event.entity';
import {YclientsEventsProcessor} from './yclients-events.processor';
import {YclientsEventsService} from './yclients-events.service';
import {AnalyticsModule} from '../analytics/analytics.module';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';
import {SendpulseClient} from '../integrations/sendpulse/sendpulse-clients.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyTransaction,
      YclientsEvent,
      TelegramCustomer,
      SendpulseClient,
    ]),
    TelegramCustomerModule,
    SendpulseModule,
    AnalyticsModule,
  ],
  providers: [
    CustomerLoyaltyService,
    YclientsClient,
    YclientsEventsProcessor,
    YclientsEventsService,
  ],
  exports: [CustomerLoyaltyService, YclientsEventsService],
})
export class CustomerLoyaltyModule {}
