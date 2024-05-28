import { registerAs } from '@nestjs/config';

export default registerAs('notification', () => ({
  removeTokenDays: Number(process.env.NOTIFICATION_REMOVE_TOKEN_DAYS) || 40,
  disablePushNotifications: process.env.NOTIFICATION_DISABLE_PUSH === 'true',
  addManagerToNotificationDelay:
    Number(process.env.NOTIFICATION_ADD_MANAGER_DELAY) || 4,
  addEmailToNotificationDelay:
    Number(process.env.NOTIFICATION_ADD_EMAIL_DELAY) || 14,
  webLink: process.env.NOTIFICATION_WEB_LINK,
  iconLink: process.env.NOTIFICATION_ICON_LINK,
}));
