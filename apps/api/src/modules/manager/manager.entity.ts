import {ApiProperty} from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Validate,
} from 'class-validator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Repository,
} from 'typeorm';
import {Injectable} from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import {InjectRepository} from '@nestjs/typeorm';
import {Transform} from 'class-transformer';
import {transformStringToBool} from '../../../src/utils/transform';

@Entity('manager')
export class Manager {
  // Swagger
  @ApiProperty({
    example: '24124',
    description: 'Unique identifier for the user',
  })
  // Typeorm
  @PrimaryGeneratedColumn()
  id: number;

  // Swagger
  @ApiProperty({
    example: 'johndoe',
    description: 'The login of the user',
    required: true,
  })
  // TypeOrm
  @Column({length: 20, nullable: false, unique: true})
  // Validation
  @IsString()
  @Length(3, 20)
  @Validate(IsUniqueLogin)
  login: string;

  // Swagger
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  // TypeOrm
  @Column({length: 100, nullable: false})
  // Validation
  @IsString()
  @Length(0, 30)
  name: string;

  // Swagger
  @ApiProperty({
    example: 'john@doe.com',
    description: 'The email of the user',
    nullable: true,
    type: String,
  })
  // TypeOrm
  @Column({unique: true, nullable: true})
  // Validation
  @IsEmail()
  @IsOptional()
  email: string | null;

  // Swagger
  @ApiProperty({example: '123456', description: "Users's password"})
  // TypeOrm
  @Column({type: 'varchar', length: 150, nullable: false})
  // Validation
  @Length(3, 100)
  password: string;

  // Swagger
  @ApiProperty({example: true, description: 'Is the user active?'})
  // Typeorm
  @Column({default: true})
  // Validation
  @IsBoolean()
  @Transform(transformStringToBool)
  is_active?: boolean;

  // Swagger
  @ApiProperty({
    example: '2023-10-10T12:00:00Z',
    description: 'Date when the user was created',
  })
  // TypeOrm
  @CreateDateColumn({type: 'timestamptz'})
  date_created?: Date;

  // Swagger
  @ApiProperty({
    example: '2023-10-10T12:00:00Z',
    description: 'Date when the user was last updated',
  })
  // TypeOrm
  @UpdateDateColumn({type: 'timestamptz'})
  date_updated?: Date;

  // Swagger
  @ApiProperty({
    example: '2023-10-10T12:00:00Z',
    description: 'Date when the user was last active',
  })
  // TypeOrm
  @Column({type: 'timestamptz', nullable: true})
  date_last_active?: Date;
}

@ValidatorConstraint({async: true})
@Injectable()
export class IsUniqueLoginConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Manager)
    private readonly userRepository: Repository<Manager>,
  ) {}

  async validate(login: string): Promise<boolean> {
    const user = await this.userRepository.find({where: {login}});
    return !user;
  }

  defaultMessage(): string {
    return 'User with login $value already exists';
  }
}

export function IsUniqueLogin(validationOptions?: ValidationOptions) {
  return function <Obj extends object>(object: Obj, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueLoginConstraint,
    });
  };
}
