import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { MailerModule } from '@nestjs-modules/mailer';

import { RegionsModule } from './common/modules/regions/regions.module';
import { FirebaseModule } from './common/modules/firebase/firebase.module';
import { AuthModule } from './common/modules/auth/auth.module';
import { UsersModule } from './users/users.module';
import { RabbitsModule } from './rabbits/rabbits.module';
import { RabbitNotesModule } from './rabbit-notes/rabbit-notes.module';
import { NotificationsModule } from './notifications/notifications.module';

import { DatabaseConfig, EmailConfig, CommonConfig } from './config';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env/${process.env.NODE_ENV}.env`,
        `.env/local.${process.env.NODE_ENV}.env`,
      ],
      load: [DatabaseConfig, EmailConfig, CommonConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [DatabaseConfig.KEY],
      useFactory: (config: ConfigType<typeof DatabaseConfig>) => config,
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    MailerModule.forRootAsync({
      inject: [EmailConfig.KEY],
      useFactory: (config: ConfigType<typeof EmailConfig>) => config,
    }),
    ScheduleModule.forRoot(),

    RegionsModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    RabbitsModule,
    RabbitNotesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
