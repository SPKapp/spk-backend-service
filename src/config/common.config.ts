import { registerAs } from '@nestjs/config';

export default registerAs('common', () => ({
  disablePushNotifications: process.env.DISABLE_PUSH_NOTIFICATIONS === 'true',
  appName: process.env.APP_NAME ?? 'HopManager Dev',
}));
