import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseService } from '../common/modules/firebase/firebase.service';
import { CommonConfig, NotificationConfig } from '../config';

import { NotificationsService } from './notifications.service';
import { TokensService } from './tokens.service';
import { UsersService } from '../users/users/users.service';

import {
  NotificationType,
  TeamAndMaybeManagerNotification,
  TeamNotification,
  UserNotification,
} from './entities';
import { User } from '../users/entities';
import { MailerService } from '@nestjs-modules/mailer';

class TestUserNotification extends UserNotification {}
class TestTeamNotification extends TeamNotification {}
class TestTeamAndMaybeManagerNotification extends TeamAndMaybeManagerNotification {}

describe(NotificationsService, () => {
  let service: NotificationsService;
  let tokensService: TokensService;
  let firebaseService: FirebaseService;
  let usersService: UsersService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: TokensService,
          useValue: {
            getTokens: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            messaging: {
              send: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            userRepository: {
              find: jest.fn(),
              findOne: jest.fn(),
            },
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: CommonConfig.KEY,
          useValue: {
            appName: 'Test App',
          },
        },
        {
          provide: NotificationConfig.KEY,
          useValue: {
            disablePushNotifications: false,
            addManagerToNotificationDelay: 4,
            addEmailToNotificationDelay: 14,
            webLink: 'https://example.com',
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    tokensService = module.get<TokensService>(TokensService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
    usersService = module.get<UsersService>(UsersService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendUserNotification - push', () => {
    const notification = new TestUserNotification();
    notification.category = 'category';
    notification.types = new Set<NotificationType>([NotificationType.Push]);
    notification.data = { testData: 'testData' };
    notification.notification = { title: 'title', body: 'body' };
    notification.userId = 1;

    it('should not send push notification if no tokens found', async () => {
      jest.spyOn(tokensService, 'getTokens').mockResolvedValue([]);

      await expect(
        service.sendNotification(notification),
      ).resolves.not.toThrow();

      expect(tokensService.getTokens).toHaveBeenCalledWith(notification.userId);
    });

    it('should send push notification if tokens found', async () => {
      jest
        .spyOn(tokensService, 'getTokens')
        .mockResolvedValue(['token1', 'token2']);

      await expect(
        service.sendNotification(notification),
      ).resolves.not.toThrow();

      expect(tokensService.getTokens).toHaveBeenCalledWith(notification.userId);
      expect(firebaseService.messaging.send).toHaveBeenCalled();
    });

    it('should send push notification without title and body', async () => {
      jest
        .spyOn(tokensService, 'getTokens')
        .mockResolvedValue(['token1', 'token2']);

      const emptyNotification = Object.create(notification);
      emptyNotification.notification = undefined;

      await expect(
        service.sendNotification(emptyNotification),
      ).resolves.not.toThrow();

      expect(tokensService.getTokens).toHaveBeenCalledWith(
        emptyNotification.userId,
      );
      expect(firebaseService.messaging.send).toHaveBeenCalled();
    });

    it('should remove tokens that are not valid', async () => {
      jest
        .spyOn(tokensService, 'getTokens')
        .mockResolvedValue(['token1', 'token2']);

      jest.spyOn(firebaseService.messaging, 'send').mockRejectedValueOnce({
        code: 'messaging/registration-token-not-registered',
      });

      await expect(
        service.sendNotification(notification),
      ).resolves.not.toThrow();

      expect(tokensService.getTokens).toHaveBeenCalledWith(notification.userId);
      expect(firebaseService.messaging.send).toHaveBeenCalledTimes(2);
      expect(tokensService.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendUserNotification - email', () => {
    const notification = new TestUserNotification();
    notification.category = 'category';
    notification.types = new Set<NotificationType>([NotificationType.Email]);
    notification.data = { testData: 'testData' };
    notification.emailData = { subject: 'subject', template: 'template' };
    notification.userId = 1;

    it('should send email notification - no email found', async () => {
      jest
        .spyOn(usersService.userRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(
        service.sendNotification(notification),
      ).resolves.not.toThrow();

      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });

    it('should send email notification - find email', async () => {
      jest.spyOn(tokensService, 'getTokens').mockResolvedValue([]);

      jest
        .spyOn(usersService.userRepository, 'findOne')
        .mockResolvedValue(new User({ id: 1, email: 'email@example.com' }));

      await expect(
        service.sendNotification(notification),
      ).resolves.not.toThrow();

      expect(mailerService.sendMail).toHaveBeenCalled();
    });

    it('should send email notification -  email provided', async () => {
      jest.spyOn(tokensService, 'getTokens').mockResolvedValue([]);

      const notificationWithEmail = Object.create(notification);
      notificationWithEmail.email = 'email@example.com';

      await expect(
        service.sendNotification(notificationWithEmail),
      ).resolves.not.toThrow();

      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendTeamNotification', () => {
    const mockedDate = new Date(2024, 4, 1);
    const notification = new TestTeamNotification();
    notification.teamId = 1;
    notification.category = 'category';
    notification.types = new Set<NotificationType>([NotificationType.Push]);
    notification.data = { testData: 'testData' };
    notification.notification = { title: 'title', body: 'body' };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockedDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should send team notification', async () => {
      jest
        .spyOn(usersService.userRepository, 'find')
        .mockResolvedValue([
          new User({ id: 1, email: 'email1@example.com' }),
          new User({ id: 2, email: 'email2@example.com' }),
        ]);
      jest.spyOn(tokensService, 'getTokens').mockResolvedValue(['token1']);

      await expect(
        service.sendNotification(notification),
      ).resolves.not.toThrow();

      expect(tokensService.getTokens).toHaveBeenNthCalledWith(1, 1);
      expect(tokensService.getTokens).toHaveBeenNthCalledWith(2, 2);
      expect(firebaseService.messaging.send).toHaveBeenCalled();
    });

    it('should send team notification with managers', async () => {
      const notificationWithManagers = new TestTeamAndMaybeManagerNotification(
        new Date(2024, 3, 21), // 10 days before
        1,
        notification.category,
        notification.types,
        notification.data,
        {
          subject: 'subject',
          template: 'template',
        },
        1,
        notification.notification,
      );

      // Admin user
      jest
        .spyOn(usersService.userRepository, 'find')
        .mockResolvedValueOnce([
          new User({ id: 1, email: 'email1@example.com' }),
        ]);
      // Team users
      jest
        .spyOn(usersService.userRepository, 'find')
        .mockResolvedValueOnce([
          new User({ id: 1, email: 'email1@example.com' }),
          new User({ id: 2, email: 'email2@example.com' }),
        ]);
      jest.spyOn(tokensService, 'getTokens').mockResolvedValue(['token1']);

      await expect(
        service.sendNotification(notificationWithManagers),
      ).resolves.not.toThrow();

      expect(tokensService.getTokens).toHaveBeenNthCalledWith(1, 1);
      expect(tokensService.getTokens).toHaveBeenNthCalledWith(2, 2);
      expect(tokensService.getTokens).toHaveBeenCalledTimes(2);
      expect(firebaseService.messaging.send).toHaveBeenCalled();
    });

    it('should send team and managers notification with email', async () => {
      const notificationWithEmail = new TestTeamAndMaybeManagerNotification(
        new Date(2024, 3, 1), // 30 days before
        1,
        notification.category,
        notification.types,
        notification.data,
        {
          subject: 'subject',
          template: 'template',
        },
        1,
        notification.notification,
      );

      // Admin user
      jest
        .spyOn(usersService.userRepository, 'find')
        .mockResolvedValueOnce([
          new User({ id: 1, email: 'email1@example.com' }),
        ]);
      // Team users
      jest
        .spyOn(usersService.userRepository, 'find')
        .mockResolvedValueOnce([
          new User({ id: 1, email: 'email1@example.com' }),
          new User({ id: 2, email: 'email2@example.com' }),
        ]);
      jest.spyOn(tokensService, 'getTokens').mockResolvedValue(['token1']);

      await expect(
        service.sendNotification(notificationWithEmail),
      ).resolves.not.toThrow();

      expect(tokensService.getTokens).toHaveBeenNthCalledWith(1, 1);
      expect(tokensService.getTokens).toHaveBeenNthCalledWith(2, 2);
      expect(tokensService.getTokens).toHaveBeenCalledTimes(2);
      expect(firebaseService.messaging.send).toHaveBeenCalled();
      expect(mailerService.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should send to managers only if teamId is not provided', async () => {
      const notificationWithManagers = new TestTeamAndMaybeManagerNotification(
        new Date(2024, 3, 30), // 2 day before (normally no managers)
        1,
        notification.category,
        notification.types,
        notification.data,
        {
          subject: 'subject',
          template: 'template',
        },
        undefined,
        notification.notification,
      );

      // Admin user
      jest
        .spyOn(usersService.userRepository, 'find')
        .mockResolvedValueOnce([
          new User({ id: 1, email: 'email1@example.com' }),
        ]);
      jest.spyOn(tokensService, 'getTokens').mockResolvedValue(['token1']);

      await expect(
        service.sendNotification(notificationWithManagers),
      ).resolves.not.toThrow();

      expect(tokensService.getTokens).toHaveBeenCalledTimes(1);
      expect(firebaseService.messaging.send).toHaveBeenCalled();
    });
  });
});
