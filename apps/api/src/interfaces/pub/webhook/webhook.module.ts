import {Module} from '@nestjs/common';
import {CustomerLoyaltyModule} from 'src/modules/customer-loyalty/customer-loyalty.module';
import {WebhookPublicController} from './webhook.controller';

@Module({
  imports: [CustomerLoyaltyModule],
  controllers: [WebhookPublicController],
})
export class WebhookPublicModule {}
