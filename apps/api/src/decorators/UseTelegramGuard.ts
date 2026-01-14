import {applyDecorators, UseGuards} from '@nestjs/common';
import {CustomerGuard} from '../interfaces/pub/customer/customer.guard';

export function UseTelegramGuard() {
  return applyDecorators(UseGuards(CustomerGuard));
}
