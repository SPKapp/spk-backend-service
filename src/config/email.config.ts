import { registerAs } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

export default registerAs('email', () => ({
  transport: {
    host: process.env.EMAIL_HOST,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  defaults: {
    from: process.env.EMAIL_FROM,
  },
  template: {
    dir: join(__dirname, '../../email-templates'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
}));
