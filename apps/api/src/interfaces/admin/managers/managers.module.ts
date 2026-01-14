import {Module} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ManagerModule} from '../../../modules/manager/manager.module';
import {ManagersAdminController} from './managers.controller';

@Module({
  imports: [ManagerModule],
  controllers: [ManagersAdminController],
  providers: [JwtService],
})
export class ManagersAdminModule {}
