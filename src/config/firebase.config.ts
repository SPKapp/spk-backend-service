import { registerAs } from '@nestjs/config';
import { ServiceAccount } from 'firebase-admin';

export default registerAs(
  'firebase',
  (): {
    emulatorsProjectId?: string;
    serviceAccount?: ServiceAccount;
  } => ({
    emulatorsProjectId: process.env.FIREBASE_EMULATORS_PROJECT_ID,
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined,
  }),
);
