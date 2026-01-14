import {Module} from '@nestjs/common';
import {AdminAuthController} from './auth.controller';
import {ManagerModule} from '../../../modules/manager/manager.module';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';

@Module({
  imports: [ManagerModule],
  providers: [JwtService, ConfigService],
  controllers: [AdminAuthController],
  exports: [JwtService, ManagerModule],
})
export class AuthAdminModule {}
