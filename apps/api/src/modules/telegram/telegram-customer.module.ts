import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TelegramCustomer} from './telegram-customer.entity';
import {TelegramCustomerService} from './telegram-customer.service';
import {TelegramLogs} from './telegram-log.entity';
import {Miniapp} from '../miniapp/miniapp.entity';
import {MiniappYclientsIntegration} from '../miniapp/miniapp-yclients.entity';
import {SendpulseModule} from '../integrations/sendpulse/sendpulse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TelegramCustomer,
      TelegramLogs,
      Miniapp,
      MiniappYclientsIntegration,
    ]),
    SendpulseModule,
  ],
  providers: [TelegramCustomerService],
  exports: [TelegramCustomerService],
})
export class TelegramCustomerModule {}
