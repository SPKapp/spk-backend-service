import * as admin from 'firebase-admin';

import * as firebaseConfigFile from '../../../config/firebaseSeviceAccountKey.json';
const firebaseConfig = firebaseConfigFile as admin.ServiceAccount;

export const Firebase = {
  provide: 'FIREBASE_APP',
  inject: [],
  useFactory: () => {
    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
  },
};
