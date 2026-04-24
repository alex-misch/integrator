import {Module} from '@nestjs/common';
import {CustomerLoyaltyService} from './customer-loyalty.service';
import {TelegramCustomerModule} from '../telegram/telegram-customer.module';
import {YclientsClient} from '../integrations/yclients/yclients.service';

@Module({
  imports: [TelegramCustomerModule],
  providers: [CustomerLoyaltyService, YclientsClient],
  exports: [CustomerLoyaltyService],
})
export class CustomerLoyaltyModule {}
