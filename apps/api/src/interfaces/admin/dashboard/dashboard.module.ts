import {Module} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ManagerModule} from '../../../modules/manager/manager.module';
import {DashboardAdminController} from './dashboard.controller';

@Module({
  imports: [ManagerModule],
  controllers: [DashboardAdminController],
  providers: [JwtService],
})
export class DashboardAdminModule {}
