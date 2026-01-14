import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {JWT_SECRET} from '../../../utils/jwt';
import {JwtStrategy} from './jwt.strategy';
import {TelegramCustomerService} from 'src/modules/telegram/telegram-customer.service';

@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private customerService: TelegramCustomerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = JwtStrategy.getToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(JWT_SECRET),
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      const customer = await this.customerService.findOne({
        where: {id: +payload.sub},
      });

      if (customer) {
        request['customer'] = customer;
      } else {
        throw new Error('User is not invited to game');
      }
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException();
    }
    return true;
  }
}
