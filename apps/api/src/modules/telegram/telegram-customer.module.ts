import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {TelegramCustomer} from './telegram-customer.entity';
import {TelegramCustomerService} from './telegram-customer.service';
import {TelegramLogs} from './telegram-log.entity';
import {Miniapp} from '../miniapp/miniapp.entity';
import {MiniappYclientsIntegration} from '../miniapp/miniapp-yclients.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TelegramCustomer,
      TelegramLogs,
      Miniapp,
      MiniappYclientsIntegration,
    ]),
  ],
  providers: [TelegramCustomerService],
  exports: [TelegramCustomerService],
})
export class TelegramCustomerModule {}
