import emailConfig from './email.config';
import commonConfig from './common.config';
import firebaseConfig from './firebase.config';
import notificationConfig from './notifications.config';

export { emailConfig as EmailConfig };
export { commonConfig as CommonConfig };
export { DatabaseConfig } from './database.config';
export { firebaseConfig as FirebaseConfig };
export { notificationConfig as NotificationConfig };

export const millisecondsInDay: number = 1000 * 60 * 60 * 24;
