import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Req,
} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserResponse} from './dto/user-response.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {UseAdminGuard} from '../../../decorators/UseAdminGuard';
import {Manager} from '../../../modules/manager/manager.entity';
import {ManagerService} from '../../../modules/manager/manager.service';
import {getPasswordHash} from '../../../utils/crypto';

@ApiTags('admin-managers')
@Controller('admin/managers')
@UseAdminGuard()
export class ManagersAdminController {
  constructor(private readonly managerService: ManagerService) {}

  reduceResponse(user: Manager): UserResponse {
    return {
      id: user.id,
      name: user.name,
      login: user.login,
      email: user.email,
      is_active: user.is_active,
      date_created: user.date_created,
      date_last_active: user.date_last_active,
    };
  }

  @Get('my')
  @ApiOperation({summary: 'Get profile of authorized user'})
  @ApiResponse({type: Manager})
  my(@Req() request) {
    return this.managerService.findOne(request['user'].id);
  }

  @Post('list')
  @ApiOperation({summary: 'Create a new user'})
  @ApiBody({
    description: 'The data required to create a user',
    type: CreateUserDto,
  })
  @ApiOkResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Validation did not pass: see the response message',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    const user = await this.managerService.create({
      ...createUserDto,
      password: await getPasswordHash(createUserDto.password),
    });
    return this.reduceResponse(user);
  }

  @Get('list')
  @ApiOperation({summary: 'Manager list'})
  @ApiOkResponse({
    isArray: true,
    type: UserResponse,
  })
  async list(): Promise<UserResponse[]> {
    const managers = await this.managerService.findAll();

    return managers.map(this.reduceResponse);
  }

  @Get('list/:id')
  @ApiOperation({summary: 'Get user by id'})
  @ApiOkResponse({type: UserResponse})
  async byId(@Param('id') id: number): Promise<UserResponse> {
    const user = await this.managerService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.reduceResponse(user);
  }

  @Post('list/:id')
  @ApiOperation({summary: 'Update user by id'})
  @ApiOkResponse({type: UserResponse})
  @ApiBadRequestResponse({
    description: 'Validation did not pass: see the response message',
  })
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    if (!updateUserDto.password) {
      delete updateUserDto.password;
    } else {
      updateUserDto.password = await getPasswordHash(updateUserDto.password);
    }
    const user = await this.managerService.update(id, updateUserDto);
    if (!user) throw new NotFoundException('User with specified id not found');
    return this.reduceResponse(user);
  }

  @Delete('list/:id')
  @ApiOperation({summary: 'Delete user by id'})
  @ApiOkResponse()
  remove(@Param('id') id: number): Promise<void> {
    return this.managerService.remove(id);
  }
}
