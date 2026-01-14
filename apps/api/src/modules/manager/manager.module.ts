import {Module} from '@nestjs/common';
import {ManagerService} from './manager.service';
import {Manager} from './manager.entity';
import {TypeOrmModule} from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Manager])],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
