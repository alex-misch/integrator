import {applyDecorators, UseGuards} from '@nestjs/common';
import {AdminGuard} from '../interfaces/admin/auth/admin.guard';

export function UseAdminGuard() {
  return applyDecorators(UseGuards(AdminGuard));
}
