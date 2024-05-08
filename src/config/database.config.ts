import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

function connectionOptions(): TypeOrmModuleOptions {
  return process.env.NODE_ENV === 'test'
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
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? {
                ca: process.env.DATABASE_SSL_CA,
              }
            : undefined,

        synchronize: process.env.NODE_ENV !== 'production',
        autoLoadEntities: true,
        logging:
          process.env.NODE_ENV === 'development' &&
          process.env.DATABASE_LOGGING === 'true'
            ? 'all'
            : false,
      };
}

export const DatabaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => connectionOptions(),
);

export default new DataSource({
  ...connectionOptions(),
  entities: ['dist/**/*.entity.js'],
} as DataSourceOptions);
