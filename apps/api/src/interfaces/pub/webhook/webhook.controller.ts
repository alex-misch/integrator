import {All, Body, Controller, HttpCode} from '@nestjs/common';
import {ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {YclientsEventsService} from 'src/modules/customer-loyalty/yclients-events.service';
import {YClientRequest} from 'src/modules/customer-loyalty/yclients-webhook.types';

@ApiTags('public-webhook')
@Controller('public/webhook')
export class WebhookPublicController {
  constructor(private readonly yclientsEvents: YclientsEventsService) {}

  @All('yclients')
  @HttpCode(200)
  @ApiOperation({summary: 'Accept YClients webhook and save event'})
  @ApiOkResponse()
  async yclients(@Body() payload: YClientRequest) {
    return this.yclientsEvents.saveWebhookEvent(payload);
  }
}
