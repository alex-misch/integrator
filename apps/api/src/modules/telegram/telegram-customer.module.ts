import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramCustomer } from './telegram-customer.entity';
import { TelegramCustomerService } from './telegram-customer.service';
import { TelegramLogs } from './telegram-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TelegramCustomer, TelegramLogs])],
  providers: [TelegramCustomerService],
  exports: [TelegramCustomerService],
})
export class TelegramCustomerModule {}
