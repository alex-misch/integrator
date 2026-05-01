import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CustomerLoyaltyService} from './customer-loyalty.service';
import {TelegramCustomerModule} from '../telegram/telegram-customer.module';
import {YclientsClient} from '../integrations/yclients/yclients.service';
import {SendpulseModule} from '../integrations/sendpulse/sendpulse.module';
import {LoyaltyTransaction} from './loyalty-transaction.entity';
import {YclientsEvent} from './yclients-event.entity';
import {YclientsEventsProcessor} from './yclients-events.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoyaltyTransaction, YclientsEvent]),
    TelegramCustomerModule,
    SendpulseModule,
  ],
  providers: [CustomerLoyaltyService, YclientsClient, YclientsEventsProcessor],
  exports: [CustomerLoyaltyService],
})
export class CustomerLoyaltyModule {}
