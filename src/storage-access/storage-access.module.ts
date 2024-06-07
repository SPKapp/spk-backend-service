import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { StorageConfig } from '../config';
import { FirebaseService } from '../common/modules/firebase';
import { RabbitsModule } from '../rabbits/rabbits.module';

import { RabbitPhotosService } from './rabbit/rabbit-photos.service';
import { RabbitPhotosResolver } from './rabbit/rabbit-photos.resolver';

@Module({
  imports: [
    ConfigModule.forFeature(StorageConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(StorageConfig)],
      inject: [FirebaseService, StorageConfig.KEY],
      useFactory: async (
        firebaseService: FirebaseService,
        storageConfig: ConfigType<typeof StorageConfig>,
      ) => {
        const privateKey = firebaseService.credential['privateKey'];
        const clientEmail = firebaseService.credential['clientEmail'];

        if (!privateKey && !storageConfig.development) {
          throw new Error('Firebase private key is missing');
        }
        if (!clientEmail && !storageConfig.development) {
          throw new Error('Firebase client email is missing');
        }

        return {
          privateKey: privateKey,
          /**
           * The following options are required to sign the token with the Firebase
           *
           * {@link https://firebase.google.com/docs/auth/admin/create-custom-tokens?hl=pl#create_custom_tokens_using_a_third-party_jwt_library}
           *
           * none algorithm is used for development purposes only
           * its used with the Firebase Emulator Suite
           */
          signOptions: {
            algorithm: privateKey ? 'RS256' : 'none',
            issuer: clientEmail ?? 'firebase-auth-emulator@example.com',
            subject: clientEmail ?? 'firebase-auth-emulator@example.com',
            audience:
              'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
            expiresIn: storageConfig.tokenValidTime,
          },
        };
      },
    }),
    RabbitsModule,
  ],
  providers: [RabbitPhotosService, RabbitPhotosResolver],
})
export class StorageAccessModule {}
