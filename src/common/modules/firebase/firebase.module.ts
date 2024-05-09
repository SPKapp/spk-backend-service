import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { FirebaseConfig } from '../../../config';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(FirebaseConfig)],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
