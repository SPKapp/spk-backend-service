import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthConfig } from '../../../config';
import { FirebaseAuthService } from './firebase-auth/firebase-auth.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(AuthConfig)],
  providers: [FirebaseAuthService],
  exports: [FirebaseAuthService],
})
export class AuthModule {}
