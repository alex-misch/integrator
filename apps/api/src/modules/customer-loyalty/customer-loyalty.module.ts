import {Module} from '@nestjs/common';
import {CustomerLoyaltyService} from './customer-loyalty.service';
import {TelegramCustomerModule} from '../telegram/telegram-customer.module';
import {YclientsClient} from '../integrations/yclients/yclients.service';
import {SendpulseModule} from '../integrations/sendpulse/sendpulse.module';

@Module({
  imports: [TelegramCustomerModule, SendpulseModule],
  providers: [CustomerLoyaltyService, YclientsClient],
  exports: [CustomerLoyaltyService],
})
export class CustomerLoyaltyModule {}
