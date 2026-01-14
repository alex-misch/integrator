import {Manager} from '../../../../modules/manager/manager.entity';
import {PickType} from '@nestjs/swagger';

export class UserResponse extends PickType(Manager, [
  'id',
  'name',
  'login',
  'email',
  'is_active',
  'date_created',
  'date_last_active',
]) {}
