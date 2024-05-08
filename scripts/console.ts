import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from '../src/app.module';

import createAdmin from './create-admin.script';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const command = process.argv[2];

  switch (command) {
    case 'create-admin':
      await createAdmin(app);
      break;
    default:
      console.log('Command not found');
      process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
