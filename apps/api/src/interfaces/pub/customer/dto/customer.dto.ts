import {PickType} from '@nestjs/swagger';
import {TelegramCustomer} from 'src/modules/telegram/telegram-customer.entity';

export class CustomerProfileResponse extends PickType(TelegramCustomer, [
  'id',
  'first_name',
  'last_name',
  'username',
  'photo_url',
  'phone',
]) {}
