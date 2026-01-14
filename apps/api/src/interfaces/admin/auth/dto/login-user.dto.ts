import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  // Swagger
  @ApiProperty({
    example: 'johndoe',
    description: 'The login of the user',
    required: true,
  })
  // Validation
  @IsString()
  @IsNotEmpty()
  readonly login: string;

  // Swagger
  @ApiProperty({
    example: 'johndoe',
    description: 'The password of the user',
    required: true,
  })
  // Validation
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}
