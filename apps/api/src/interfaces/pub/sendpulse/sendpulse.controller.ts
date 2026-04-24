import {All, Body, Controller} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {SendpulseService} from 'src/modules/integrations/sendpulse/sendpulse.service';

@ApiTags('public-sendpulse')
@Controller('public/sendpulse')
export class SendpulsePublicController {
  constructor(private readonly sendpulseWebhookService: SendpulseService) {}

  @All('webhook')
  @ApiOperation({
    summary: 'Accept Sendpulse webhook and save sendpulse_start payload',
  })
  async webhook(@Body() payload: unknown) {
    return this.sendpulseWebhookService.saveStartEvent(payload);
  }
}
