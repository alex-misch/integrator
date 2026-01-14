import {NestFactory} from '@nestjs/core';
import {AppModule} from './app/app.module';
import * as cookieParser from 'cookie-parser';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {ValidationPipe} from '@nestjs/common';
import * as dotenv from 'dotenv';
import {useContainer} from 'class-validator';
import {AllExceptionsFilter} from './filters/all-exception-filter';
import {ADMIN_AUTH_COOKIE_NAME} from './interfaces/admin/auth/jwt.strategy';
import {NestExpressApplication} from '@nestjs/platform-express';

// Загружаем переменные окружения
dotenv.config({path: '../.env'});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // Буферизация логов до инициализации
    logger: ['error', 'warn', 'fatal'],
  });

  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address

  // const logger = app.get(WinstonModule);
  app.useLogger(console);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically removes fields that are not in the DTO
      forbidNonWhitelisted: true, // Throws an error if fields not in the DTO are detected
      transform: true, // Transforms input data to the types specified in the DTO (e.g., converts strings to numbers)
    }),
  );
  useContainer(app.select(AppModule), {fallbackOnErrors: true});

  // Enable using cookie in request
  app.use(cookieParser());

  // TODO: uncomment dev
  if (process.env.NODE_ENV !== 'production') {
    // Swagger initialization
    const config = new DocumentBuilder()
      .setTitle('integrator project API')
      .setVersion('1.0')
      .addSecurity('Manager cookie', {
        type: 'apiKey',
        in: 'cookie',
        name: ADMIN_AUTH_COOKIE_NAME,
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }

  // Run app
  await app.listen(process.env.PORT || '3000');
  console.log('Listening port', process.env.PORT);
}
bootstrap();
