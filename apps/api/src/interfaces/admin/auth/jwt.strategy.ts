import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {Request, Response} from 'express';
import {JWT_SECRET} from '../../../utils/jwt';
import {ConfigService} from '@nestjs/config';
import {ManagerService} from '../../../modules/manager/manager.service';

export type JwtPayload = {
  sub: string;
  username: string;
  version: string;
};

export const ADMIN_AUTH_COOKIE_NAME = 'admjwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly managerService: ManagerService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.[ADMIN_AUTH_COOKIE_NAME];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(JWT_SECRET),
    });
  }

  static clearToken(response: Response) {
    response.clearCookie(ADMIN_AUTH_COOKIE_NAME);
  }

  static saveToken(response: Response, token: string) {
    response.cookie(ADMIN_AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  static getToken(request: Request) {
    return request.cookies[ADMIN_AUTH_COOKIE_NAME];
  }

  async validate(payload: JwtPayload) {
    const user = await this.managerService.findOne(+payload.sub);

    if (!user || !user.is_active || payload.username !== user.login) {
      throw new Error('Unauthorized');
    }

    return user;
  }
}
