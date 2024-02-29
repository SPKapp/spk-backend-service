import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { Firebase } from './firebase';

@Global()
@Module({
  providers: [FirebaseService, Firebase],
  exports: [FirebaseService],
})
export class FirebaseModule {}
