import {ApiProperty, PickType} from '@nestjs/swagger';
import {TelegramCustomer} from 'src/modules/telegram/telegram-customer.entity';

export class CustomerProfileResponse extends PickType(TelegramCustomer, [
  'id',
  'first_name',
  'last_name',
  'username',
  'photo_url',
  'phone',
  'referral_code',
]) {
  @ApiProperty({example: 3})
  referral_count: number;

  @ApiProperty({example: 150})
  referral_payments_amount: number;
}
