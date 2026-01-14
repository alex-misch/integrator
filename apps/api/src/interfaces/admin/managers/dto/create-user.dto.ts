import {PickType} from '@nestjs/swagger';
import {Manager} from '../../../../modules/manager/manager.entity';

export class CreateUserDto extends PickType(Manager, [
  'login',
  'name',
  'email',
  'password',
  'is_active',
]) {}
