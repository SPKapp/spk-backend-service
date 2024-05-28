import { registerAs } from '@nestjs/config';

export default registerAs('common', () => ({
  disablePushNotifications: process.env.DISABLE_PUSH_NOTIFICATIONS === 'true',
  addManagerToNotificationDelay:
    Number(process.env.ADD_MANAGER_TO_NOTIFICATION_DELAY) || 4,
  addEmailToNotificationDelay:
    Number(process.env.ADD_EMAIL_TO_NOTIFICATION_DELAY) || 14,
  appName: process.env.APP_NAME ?? 'HopManager Dev',
}));
