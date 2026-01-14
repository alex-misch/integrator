import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {JwtService} from '@nestjs/jwt';
import {Response} from 'express';
import {JwtPayload, JwtStrategy} from './jwt.strategy';
import {JWT_SECRET} from '../../../utils/jwt';
import {ConfigService} from '@nestjs/config';
import {UseTelegramGuard} from '../../../decorators/UseTelegramGuard';
import {TelegramCustomerService} from 'src/modules/telegram/telegram-customer.service';
import {CustomerProfileResponse} from './dto/customer.dto';
import {VerifyCustomerDto} from 'src/modules/telegram/dto/telegram-customer.dto';

@ApiTags('public-customer')
@Controller('public/customer')
export class CustomerPublicController {
  constructor(
    private readonly customerService: TelegramCustomerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('profile')
  @ApiOperation({summary: 'Get profile'})
  @ApiOkResponse({type: CustomerProfileResponse})
  @UseTelegramGuard()
  async profile(@Req() request): Promise<CustomerProfileResponse> {
    const customer = await this.customerService.findOne({
      where: {id: +request.customer.id},
    });
    return {
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      username: customer.username,
      photo_url: customer.photo_url,
      phone: customer.phone,
    };
  }

  @Post('verify')
  @HttpCode(200)
  @ApiOperation({summary: 'Verify initData from telegram'})
  @ApiBody({type: VerifyCustomerDto})
  @ApiUnauthorizedResponse({description: 'Fail to validate user'})
  async verify(
    @Body() payload: VerifyCustomerDto,
    @Req() request,
    @Res({passthrough: true}) response: Response,
  ) {
    // Verify by jwt cookie
    const token = JwtStrategy.getToken(request);
    try {
      const jwtPayload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>(JWT_SECRET),
      });
      const jwtCustomer = await this.customerService.findOne({
        where: {id: +jwtPayload.sub},
      });
      if (token && jwtPayload && jwtCustomer?.username == jwtPayload.username) {
        return jwtCustomer;
      }
      throw new Error('Fail to verify JWT');
    } catch {
      // Verify by telegram initData
      const customer = await this.customerService.verify(
        payload.initData,
        payload.startParam,
        payload.company_id,
      );
      if (!customer) {
        throw new UnauthorizedException('Fail to validate user');
      }

      const tokenPayload = {
        sub: customer.id,
        username: customer.username,
      };

      const access_token = this.jwtService.sign(tokenPayload, {
        secret: this.configService.get<string>(JWT_SECRET),
      });

      JwtStrategy.saveToken(response, access_token);

      await this.customerService.login(customer.id);
      return customer;
    }
  }
}
