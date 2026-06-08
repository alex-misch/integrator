import {Module} from '@nestjs/common';
import {MiniappsPublicController} from './miniapps.controller';
import {MiniappModule} from 'src/modules/miniapp/miniapp.module';
import {YclientsClient} from 'src/modules/integrations/yclients/yclients.service';
import {JwtService} from '@nestjs/jwt';
import {TelegramCustomerModule} from 'src/modules/telegram/telegram-customer.module';
import {SendpulseModule} from 'src/modules/integrations/sendpulse/sendpulse.module';

@Module({
  imports: [MiniappModule, TelegramCustomerModule, SendpulseModule],
  controllers: [MiniappsPublicController],
  providers: [JwtService, YclientsClient],
})
export class MiniappsPublicModule {}
