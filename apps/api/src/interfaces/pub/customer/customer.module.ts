import {Module} from '@nestjs/common';
import {CustomerPublicController} from './customer.controller';
import {ConfigModule} from '@nestjs/config';
import {JwtModule, JwtService} from '@nestjs/jwt';
import {JWT_SECRET} from '../../../utils/jwt';
import {TelegramCustomerModule} from 'src/modules/telegram/telegram-customer.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env[JWT_SECRET],
      signOptions: {expiresIn: '240h'},
    }),
    TelegramCustomerModule,
  ],
  providers: [JwtService],
  controllers: [CustomerPublicController],
  exports: [],
})
export class CustomerPublicModule {}
