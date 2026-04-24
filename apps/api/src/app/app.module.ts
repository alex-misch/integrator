import {MiddlewareConsumer, Module, RequestMethod} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {resolve} from 'path';
import {ServeStaticModule} from '@nestjs/serve-static';

import {CorsMiddleware} from '../middleware/cors';
import {DBFile} from '../modules/files/files.entity';
import {Manager} from '../modules/manager/manager.entity';
import {AuthAdminModule} from '../interfaces/admin/auth/auth.module';
import {ManagersAdminModule} from '../interfaces/admin/managers/managers.module';
import {DashboardAdminModule} from '../interfaces/admin/dashboard/dashboard.module';
import {MiniappsAdminModule} from '../interfaces/admin/miniapps/miniapps.module';
import {ScheduleModule} from '@nestjs/schedule';
import {RateLimitModule} from '../modules/rate-limit/rate-limit.module';
import {RateLimitEntity} from '../modules/rate-limit/rate-limit.entity';
import {getPostgresCredentials} from '../utils/postgres';
import {CustomerPublicModule} from 'src/interfaces/pub/customer/customer.module';
import {MiniappsPublicModule} from 'src/interfaces/pub/miniapps/miniapps.module';
import {SendpulsePublicModule} from 'src/interfaces/pub/sendpulse/sendpulse.module';
import {WalletPublicModule} from 'src/interfaces/pub/wallet/wallet.module';
import {TelegramCustomerModule} from 'src/modules/telegram/telegram-customer.module';
import {TelegramCustomer} from 'src/modules/telegram/telegram-customer.entity';
import {TelegramLogs} from 'src/modules/telegram/telegram-log.entity';
import {Miniapp} from 'src/modules/miniapp/miniapp.entity';
import {MiniappYclientsIntegration} from 'src/modules/miniapp/miniapp-yclients.entity';
import {MiniappReview} from 'src/modules/miniapp/miniapp-review.entity';
import {MiniappService} from 'src/modules/miniapp/miniapp-service.entity';
import {MiniappSpecialist} from 'src/modules/miniapp/miniapp-specialist.entity';
import {MiniappBooking} from 'src/modules/miniapp/miniapp-booking.entity';
import {MiniappSeance} from 'src/modules/miniapp/miniapp-seance.entity';
import {MiniappModule} from 'src/modules/miniapp/miniapp.module';
import {SendpulseClient} from 'src/modules/integrations/sendpulse/sendpulse-clients.entity';
import {SendpulseLog} from 'src/modules/integrations/sendpulse/sendpulse-logs.entity';

@Module({
  imports: [
    // Environment
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Database connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      entities: [
        DBFile,
        Manager,
        RateLimitEntity,
        TelegramCustomer,
        TelegramLogs,
        Miniapp,
        MiniappYclientsIntegration,
        MiniappReview,
        MiniappService,
        MiniappSpecialist,
        MiniappBooking,
        MiniappSeance,
        SendpulseClient,
        SendpulseLog,
      ],
      migrations: ['dist/migrations/*.js'],
      synchronize: false,
      logging:
        process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : false,
      ...getPostgresCredentials(),
    }),
    ServeStaticModule.forRoot({
      rootPath: resolve('assets'),
      serveRoot: '/assets',
    }),
    RateLimitModule,
    ScheduleModule.forRoot(),
    AuthAdminModule,
    ManagersAdminModule,
    DashboardAdminModule,
    MiniappsAdminModule,
    CustomerPublicModule,
    MiniappsPublicModule,
    SendpulsePublicModule,
    WalletPublicModule,
    TelegramCustomerModule,
    MiniappModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware)
      .forRoutes({path: '*', method: RequestMethod.ALL});
  }
}

console.log(
  'CONNECT',
  `postgresql://${process.env.DB_USER}:***@${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME}?schema=public`,
);
