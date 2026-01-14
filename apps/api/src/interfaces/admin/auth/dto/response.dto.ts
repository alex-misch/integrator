import {PickType} from '@nestjs/swagger';
import {Manager} from '../../../../modules/manager/manager.entity';

export class ManagerResponse extends PickType(Manager, [
  'id',
  'name',
  'login',
  'email',
  'is_active',
  'date_created',
  'date_last_active',
]) {}
