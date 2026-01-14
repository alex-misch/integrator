import { PickType } from '@nestjs/swagger';
import { Manager } from '../manager.entity';

export class CreateManagerDto extends PickType(Manager, [
  'login',
  'name',
  'email',
  'password',
  'is_active',
]) {}
