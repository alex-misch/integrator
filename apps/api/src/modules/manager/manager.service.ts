import { Injectable } from '@nestjs/common';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Manager } from './manager.entity';

@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(Manager)
    private readonly usersRepository: Repository<Manager>,
  ) {}

  async findByLogin(login: string): Promise<Manager | null> {
    return this.usersRepository.findOne({ where: { login } });
  }

  async create(dto: CreateManagerDto): Promise<Manager> {
    const newUser = this.usersRepository.create(dto);
    await this.usersRepository.insert(newUser);

    return newUser;
  }

  async findAll(): Promise<Manager[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: number): Promise<Manager | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateManagerDto): Promise<Manager | null> {
    await this.usersRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
