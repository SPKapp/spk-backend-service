import { registerAs } from '@nestjs/config';

export default registerAs('common', () => ({
  appName: process.env.APP_NAME ?? 'HopManager Dev',
}));
