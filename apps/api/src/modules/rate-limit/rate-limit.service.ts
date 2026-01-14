import {Injectable} from '@nestjs/common';
import {PgThrottlerStorage} from './pgthrottler.storage';

@Injectable()
export class RateLimitService {
  constructor(private readonly throttler: PgThrottlerStorage) {}

  /**
   * Сбрасывает rate‐limit для данного ключа (например, IP)
   */
  async resetForKey(key: string): Promise<void> {
    await this.throttler.delete(key);
  }

  /** Сбросить ВСЕ лимиты во всём сторе */
  async resetAll(): Promise<void> {
    if (this.throttler?.deleteAll) {
      this.throttler.deleteAll();
      return;
    }

    throw new Error('Unsupported throttler storage: cannot reset all limits');
  }
}
