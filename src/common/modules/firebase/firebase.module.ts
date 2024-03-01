import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import firebaseConfig from '../../../config/firebase.config';

import { FirebaseService } from './firebase.service';
import { Firebase } from './firebase';

@Global()
@Module({
  imports: [ConfigModule.forFeature(firebaseConfig)],
  providers: [FirebaseService, Firebase],
  exports: [FirebaseService],
})
export class FirebaseModule {}
