import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  development: process.env.NODE_ENV === 'development',
  tokenValidTime: Number(process.env.STORAGE_TOKEN_EXPIRATION) || 900,
}));
