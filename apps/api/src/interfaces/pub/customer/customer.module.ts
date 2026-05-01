import {Module} from '@nestjs/common';
import {CustomerPublicController} from './customer.controller';
import {ConfigModule} from '@nestjs/config';
import {JwtModule, JwtService} from '@nestjs/jwt';
import {JWT_SECRET} from '../../../utils/jwt';
import {TelegramCustomerModule} from 'src/modules/telegram/telegram-customer.module';
import {SendpulseModule} from 'src/modules/integrations/sendpulse/sendpulse.module';
import {CustomerLoyaltyModule} from 'src/modules/customer-loyalty/customer-loyalty.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env[JWT_SECRET],
      signOptions: {expiresIn: '240h'},
    }),
    TelegramCustomerModule,
    SendpulseModule,
    CustomerLoyaltyModule,
  ],
  providers: [JwtService],
  controllers: [CustomerPublicController],
  exports: [],
})
export class CustomerPublicModule {}
