import { registerAs } from '@nestjs/config';

export default registerAs('notification', () => ({
  cutOffDays: Number(process.env.NOTIFICATION_CUTOFF_DAYS) || 40,
}));
