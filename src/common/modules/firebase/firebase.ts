import { ConfigType } from '@nestjs/config';
import * as admin from 'firebase-admin';

import firebaseConfig from '../../../config/firebase.config';

export const Firebase = {
  provide: 'FIREBASE_APP',
  inject: [firebaseConfig.KEY],
  useFactory: (config: ConfigType<typeof firebaseConfig>) => {
    return admin.initializeApp({
      credential: admin.credential.cert(config),
    });
  },
};
