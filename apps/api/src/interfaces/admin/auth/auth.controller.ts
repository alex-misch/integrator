import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Res,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {AdminGuard} from './admin.guard';
import {LoginUserDto} from './dto/login-user.dto';
import {Response} from 'express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {JwtPayload, JwtStrategy} from './jwt.strategy';
import {ManagerService} from '../../../modules/manager/manager.service';
import {JwtService} from '@nestjs/jwt';
import {JWT_SECRET} from '../../../utils/jwt';
import {ManagerResponse} from '../../../modules/manager/dto/manager-response.dto';
import {ConfigService} from '@nestjs/config';
import {comparePassword} from '../../../utils/crypto';

@ApiTags('admin/auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly managerService: ManagerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async validateUser(payload?: LoginUserDto): Promise<boolean> {
    if (!payload) throw new UnauthorizedException('Invalid credentials');
    if (!payload.login) throw new BadRequestException('Login is required');
    if (!payload.password)
      throw new BadRequestException('Passowrd is required');

    const user = await this.managerService.findByLogin(payload?.login);

    if (user) {
      if (!user.is_active) {
        throw new BadRequestException(
          'Your are banned from service. Please, contact admin.',
        );
      }

      return await comparePassword(payload.password, user.password);
    }
    return false;
  }

  @Post('admin/auth/login')
  @ApiOperation({summary: 'Sign in for user'})
  @ApiBody({
    description: 'The data required to create a user',
    type: LoginUserDto,
  })
  @ApiOkResponse({
    status: 200,
    type: ManagerResponse,
    description: 'You has been successfully signed in.',
  })
  @ApiBadRequestResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() payload: LoginUserDto,
    @Res({passthrough: true}) response: Response,
  ) {
    const isValid = await this.validateUser(payload);
    if (isValid) {
      const login = payload.login;
      const user = await this.managerService.findByLogin(login);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const userData: JwtPayload = {
        sub: `${user.id}`,
        username: user.login,
        version: '2',
      };

      const access_token = this.jwtService.sign(userData, {
        secret: this.configService.get<string>(JWT_SECRET),
      });

      // Устанавливаем токен в куку
      JwtStrategy.saveToken(response, access_token);

      return {message: 'OK!'};
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @UseGuards(AdminGuard)
  @Get('admin/getProfile')
  @ApiOperation({summary: 'User profile'})
  @ApiOkResponse({
    status: 200,
    type: ManagerResponse,
    description: 'Your profile.',
  })
  @ApiBadRequestResponse({
    status: 401,
    description: 'You are unauthorized',
  })
  getProfile(@Req() req) {
    return req.user;
  }

  @Post('admin/auth/logout')
  @ApiOperation({summary: 'Sign out for user session'})
  @ApiOkResponse({
    status: 200,
    description: 'Your are successfully signed out.',
  })
  logout(@Res({passthrough: true}) response: Response) {
    JwtStrategy.clearToken(response);

    return {message: 'Logged out'};
  }
}
