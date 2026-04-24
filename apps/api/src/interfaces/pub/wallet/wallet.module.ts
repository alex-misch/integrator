import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {JwtModule, JwtService} from '@nestjs/jwt';
import {JWT_SECRET} from 'src/utils/jwt';
import {WalletPublicController} from './wallet.controller';
import {TelegramCustomerModule} from 'src/modules/telegram/telegram-customer.module';
import {CustomerLoyaltyModule} from 'src/modules/customer-loyalty/customer-loyalty.module';
import {CustomerGuard} from '../customer/customer.guard';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env[JWT_SECRET],
      signOptions: {expiresIn: '240h'},
    }),
    TelegramCustomerModule,
    CustomerLoyaltyModule,
  ],
  controllers: [WalletPublicController],
  providers: [JwtService, CustomerGuard],
})
export class WalletPublicModule {}
