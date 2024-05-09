import { registerAs } from '@nestjs/config';

export default registerAs(
  'firebase',
  (): {
    emulatorsProjectId?: string;
  } => ({
    emulatorsProjectId: process.env.FIREBASE_EMULATORS_PROJECT_ID,
  }),
);
