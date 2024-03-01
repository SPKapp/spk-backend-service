import { registerAs } from '@nestjs/config';
import * as admin from 'firebase-admin';

export default registerAs(
  'firebase',
  (): admin.ServiceAccount =>
    process.env.FIREBASE_CONFIG_FILE
      ? require(`${process.cwd()}/${process.env.FIREBASE_CONFIG_FILE}`)
      : JSON.parse(process.env.FIREBASE_CONFIG),
);
