import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TelegramCustomer} from 'src/modules/telegram/telegram-customer.entity';
import {SendpulseClient} from './sendpulse-clients.entity';
import {SendpulseLog} from './sendpulse-logs.entity';
import {SendpulseService} from './sendpulse.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SendpulseClient, SendpulseLog, TelegramCustomer]),
  ],
  providers: [SendpulseService],
  exports: [SendpulseService],
})
export class SendpulseModule {}
