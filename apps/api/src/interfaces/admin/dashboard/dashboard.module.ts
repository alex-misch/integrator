import {Module} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ManagerModule} from '../../../modules/manager/manager.module';
import {DashboardAdminController} from './dashboard.controller';
import {AnalyticsModule} from 'src/modules/analytics/analytics.module';

@Module({
  imports: [ManagerModule, AnalyticsModule],
  controllers: [DashboardAdminController],
  providers: [JwtService],
})
export class DashboardAdminModule {}
