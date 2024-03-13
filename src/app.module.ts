import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegionsModule } from './common/modules/regions/regions.module';
import { FirebaseModule } from './common/modules/firebase/firebase.module';
import { AuthModule } from './common/modules/auth/auth.module';
import { UsersModule } from './users/users.module';
import { RabbitsModule } from './rabbits/rabbits.module';

import databaseConfig from './config/database.config';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env/${process.env.NODE_ENV}.env`],
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config: ConfigType<typeof databaseConfig>) => config,
    }),

    RegionsModule,

    FirebaseModule,

    AuthModule,

    UsersModule,

    RabbitsModule,
  ],
})
export class AppModule {}
