import emailConfig from './email.config';
import commonConfig from './common.config';
import firebaseConfig from './firebase.config';
import notificationConfig from './notifications.config';
import cronConfig from './cron.config';
import authConfig from './auth.config';
import storageConfig from './storage.config';

export { emailConfig as EmailConfig };
export { commonConfig as CommonConfig };
export { DatabaseConfig } from './database.config';
export { firebaseConfig as FirebaseConfig };
export { notificationConfig as NotificationConfig };
export { cronConfig as CronConfig };
export { authConfig as AuthConfig };
export { storageConfig as StorageConfig };

export const millisecondsInDay: number = 1000 * 60 * 60 * 24;
