import {Controller, Get, Query} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {UseAdminGuard} from '../../../decorators/UseAdminGuard';

import {DashboardCountersResponse, DashboardFilter} from './dto/dashboard.dto';
import {AnalyticsService} from 'src/modules/analytics/analytics.service';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
@UseAdminGuard()
export class DashboardAdminController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({summary: 'Get ET Laser dashboard analytics'})
  @ApiResponse({type: DashboardCountersResponse})
  async listCounters(
    @Query() filter: DashboardFilter,
  ): Promise<DashboardCountersResponse> {
    return this.analytics.getDashboard(filter.period ?? '7d');
  }
}
