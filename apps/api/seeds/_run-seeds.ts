import dataSource from '../ormconfig';
// import {CategorySeed} from './category.seed';
import {UserSeed} from './users.seed';
import {config} from 'dotenv';

config();

async function runSeeds() {
  try {
    // Инициализируем подключение к базе данных
    await dataSource.initialize();

    // Запуск конкретных Seed'ов
    await new UserSeed().run(dataSource);
    // await new CategorySeed().run(dataSource);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error running seeds:', err);
    process.exit(1);
  }
}

runSeeds();
