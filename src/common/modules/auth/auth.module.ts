import { Module } from '@nestjs/common';
import { FirebaseAuthService } from './firebase-auth/firebase-auth.service';

@Module({
  providers: [FirebaseAuthService],
  exports: [FirebaseAuthService],
})
export class AuthModule {}
