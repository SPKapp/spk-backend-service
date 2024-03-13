import { Global, Module } from '@nestjs/common';

import { FirebaseAuthService } from './firebase-auth/firebase-auth.service';
import { AuthService } from './auth.service';

@Global()
@Module({
  providers: [FirebaseAuthService, AuthService],
  exports: [FirebaseAuthService, AuthService],
})
export class AuthModule {}

export { AuthService } from './auth.service';
export { FirebaseAuth } from './firebase-auth/firebase-auth.decorator';
export { FirebaseAuthGuard } from './firebase-auth/firebase-auth.guard';
export { Role } from './roles.eum';
export {
  getCurrentUserPipe,
  CurrentUser,
} from './current-user/current-user.decorator';
export { UserDetails } from './current-user/current-user';
