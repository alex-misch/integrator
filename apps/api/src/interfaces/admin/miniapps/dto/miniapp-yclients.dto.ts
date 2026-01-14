import {PickType} from '@nestjs/swagger';
import {MiniappYclientsIntegration} from '../../../../modules/miniapp/miniapp-yclients.entity';

export class MiniappYclientsCreateDto extends PickType(
  MiniappYclientsIntegration,
  ['company_id'],
) {}
