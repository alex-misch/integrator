import {Module} from '@nestjs/common';
import {MiniappModule} from '../../../modules/miniapp/miniapp.module';
import {MiniappsAdminController} from './miniapps.controller';
import {ManagerModule} from 'src/modules/manager/manager.module';
import {JwtService} from '@nestjs/jwt';
import {YclientsClient} from 'src/modules/integrations/yclients/yclients.service';

@Module({
  imports: [MiniappModule, ManagerModule],
  controllers: [MiniappsAdminController],
  providers: [JwtService, YclientsClient],
})
export class MiniappsAdminModule {}
