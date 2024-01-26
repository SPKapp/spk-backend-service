import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions =>
    process.env.NODE_ENV === 'test'
      ? {
          type: 'sqlite',
          database: ':memory:',
          synchronize: true,
          autoLoadEntities: true,
        }
      : {
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: parseInt(process.env.DATABASE_PORT, 10),
          username: process.env.DATABASE_USERNAME,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          synchronize: process.env.NODE_ENV !== 'production',
          autoLoadEntities: true,
          logging:
            process.env.NODE_ENV === 'development' &&
            process.env.DATABASE_LOGGING === 'true'
              ? 'all'
              : false, // "all"
        },
);
