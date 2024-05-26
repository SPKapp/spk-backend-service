import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { NotificationConfig } from '../config';

import { TokensService } from './tokens.service';
import { TokensResolver } from './tokens.resolver';

import { FcmToken } from './entities';

@Module({
  imports: [
    ConfigModule.forFeature(NotificationConfig),
    TypeOrmModule.forFeature([FcmToken]),
  ],
  providers: [TokensResolver, TokensService],
})
export class NotificationsModule {}
