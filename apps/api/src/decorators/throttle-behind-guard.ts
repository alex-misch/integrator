import {ThrottlerGuard} from '@nestjs/throttler';
import {Injectable} from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    return req.headers['x-real-ip'];
  }
}
