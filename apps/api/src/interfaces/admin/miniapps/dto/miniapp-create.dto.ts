import {PickType} from '@nestjs/swagger';
import {Miniapp} from '../../../../modules/miniapp/miniapp.entity';

export class MiniappCreateDto extends PickType(Miniapp, [
  'name',
  'slug',
  'telegram_bot_token',
]) {}
