import {Global, Module} from '@nestjs/common';
import {RateLimitService} from './rate-limit.service';
import {ThrottlerModule, ThrottlerModuleOptions} from '@nestjs/throttler';
import {RateLimitEntity} from './rate-limit.entity';
import {PgThrottlerStorage} from './pgthrottler.storage';
import {TypeOrmModule} from '@nestjs/typeorm';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([RateLimitEntity]),
    ThrottlerModule.forRootAsync({
      inject: [PgThrottlerStorage],
      useFactory: (storage: PgThrottlerStorage): ThrottlerModuleOptions => ({
        errorMessage: 'Слишком много запросов — попробуйте позже',
        throttlers: [
          {ttl: 900, limit: 10, blockDuration: 900, name: 'default'},
        ],
        storage,
      }),
    }),
  ],
  providers: [PgThrottlerStorage, RateLimitService],
  exports: [RateLimitService, PgThrottlerStorage, ThrottlerModule],
})
export class RateLimitModule {}
