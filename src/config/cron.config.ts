import { registerAs } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';

export default registerAs('cron', () => ({
  checkAdmissionState:
    process.env.CRON_CHECK_ADMISSION_STATE ?? CronExpression.EVERY_DAY_AT_7PM,
  checkAdoptionState:
    process.env.CRON_CHECK_ADOPTION_STATE ?? CronExpression.EVERY_DAY_AT_8PM,
  removeOldFcmTokens:
    process.env.CRON_REMOVE_OLD_FCM_TOKENS ?? CronExpression.EVERY_DAY_AT_1AM,
}));
