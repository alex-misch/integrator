import {DataSource} from 'typeorm';
import {Manager} from '../src/modules/manager/manager.entity';
import {getPasswordHash} from '../src/utils/crypto';

export class UserSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(Manager);

    const users: Partial<Manager>[] = [
      {
        login: 'test',
        email: 'john@example.com',
        password: await getPasswordHash('1234'),
        name: 'John',
      },
    ];

    await userRepository.save(users);
  }
}
