import {Module} from '@nestjs/common';
import {SendpulsePublicController} from './sendpulse.controller';
import {SendpulseModule} from 'src/modules/integrations/sendpulse/sendpulse.module';

@Module({
  imports: [SendpulseModule],
  controllers: [SendpulsePublicController],
})
export class SendpulsePublicModule {}
