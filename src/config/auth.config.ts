import { registerAs } from '@nestjs/config';
import { ActionCodeSettings } from 'firebase-admin/auth';

export default registerAs(
  'auth',
  (): {
    actionCodeSettings: ActionCodeSettings;
  } => ({
    actionCodeSettings: {
      url: process.env.AUTH_REDIRECT_URL,
      //   handleCodeInApp: true,
      //   iOS: {
      //     bundleId: process.env.IOS_BUNDLE_ID,
      //   },
      //   android: {
      //     packageName: process.env.ANDROID_PACKAGE_NAME,
      //     installApp: true,
      //     minimumVersion: process.env.ANDROID_MINIMUM_VERSION,
      //   },
    },
  }),
);
