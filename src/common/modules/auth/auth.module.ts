import { Global, Module } from '@nestjs/common';

import { FirebaseAuthService } from './firebase-auth/firebase-auth.service';

@Global()
@Module({
  providers: [FirebaseAuthService],
  exports: [FirebaseAuthService],
})
export class AuthModule {}
