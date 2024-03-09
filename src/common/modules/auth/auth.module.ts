import { Module } from '@nestjs/common';
import { FirebaseAuthService } from './firebase-auth/firebase-auth.service';
import { AuthService } from './auth.service';

@Module({
  providers: [FirebaseAuthService, AuthService],
  exports: [FirebaseAuthService, AuthService],
})
export class AuthModule {}
