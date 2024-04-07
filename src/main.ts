import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from './app.module';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();
