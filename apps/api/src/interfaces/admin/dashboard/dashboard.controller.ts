import {Controller, Get, Query} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {UseAdminGuard} from '../../../decorators/UseAdminGuard';

import {DashboardFilter} from './dto/dashboard.dto';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
@UseAdminGuard()
export class DashboardAdminController {
  constructor() {}

  @Get('dashboard')
  @ApiOperation({summary: 'Get profile of authorized user'})
  // @ApiResponse({type: })
  async listCounters(@Query() filter: DashboardFilter) {}
}
