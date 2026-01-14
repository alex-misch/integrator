import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Miniapp} from './miniapp.entity';
import {MiniappYclientsIntegration} from './miniapp-yclients.entity';
import {MiniappReview} from './miniapp-review.entity';
import {MiniappService} from './miniapp-service.entity';
import {MiniappSpecialist} from './miniapp-specialist.entity';
import {MiniappBooking} from './miniapp-booking.entity';
import {MiniappSeance} from './miniapp-seance.entity';
import {MiniappService as MiniappDomainService} from './miniapp.service';
import {ManagerModule} from '../manager/manager.module';
import {JwtModule} from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Miniapp,
      MiniappYclientsIntegration,
      MiniappReview,
      MiniappService,
      MiniappSpecialist,
      MiniappBooking,
      MiniappSeance,
    ]),
    ManagerModule,
  ],
  providers: [MiniappDomainService],
  exports: [TypeOrmModule, MiniappDomainService],
})
export class MiniappModule {}
