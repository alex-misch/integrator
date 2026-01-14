import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {Request} from 'express';
import {JWT_SECRET} from '../../../utils/jwt';
import {Response} from 'express';
import {ConfigService} from '@nestjs/config';
import {TelegramCustomerService} from 'src/modules/telegram/telegram-customer.service';

export const CUSTOMER_COOKIE_NAME = 'jwtcust';

export type JwtPayload = {
  sub: string;
  username: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly customerService: TelegramCustomerService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.[CUSTOMER_COOKIE_NAME];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(JWT_SECRET),
    });
  }

  static saveToken(response: Response, token: string) {
    response.cookie(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  static getToken(request: Request) {
    return request.cookies[CUSTOMER_COOKIE_NAME];
  }

  async validate(payload: JwtPayload) {
    const user = await this.customerService.findOne({
      where: {id: +payload.sub},
    });

    if (!user || user.is_blocked || payload.username !== user.username) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
