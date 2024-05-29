import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseService } from '../common/modules/firebase/firebase.service';
import { NotificationConfig } from '../config';

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

class TestUserNotification extends UserNotification {}
class TestTeamNotification extends TeamNotification {}
class TestTeamAndMaybeManagerNotification extends TeamAndMaybeManagerNotification {}

describe(NotificationsService, () => {
  let service: NotificationsService;
  let tokensService: TokensService;
  let firebaseService: FirebaseService;
  let usersService: UsersService;

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
          provide: NotificationConfig.KEY,
          useValue: {
            disablePushNotifications: false,
            addManagerToNotificationDelay: 4,
            addEmailToNotificationDelay: 14,
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    tokensService = module.get<TokensService>(TokensService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendUserNotification - push', () => {
    const notification = new TestUserNotification(
      'category',
      new Set<NotificationType>([NotificationType.Push]),
      {
        testData: 'testData',
      },
      {
        title: 'title',
        body: 'body',
      },
      1,
    );

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

  describe('sendTeamNotification - push', () => {
    const mockedDate = new Date(2024, 4, 1);
    const notification = new TestTeamNotification(
      1,
      'category',
      new Set<NotificationType>([NotificationType.Push]),
      {
        testData: 'testData',
      },
      {
        title: 'title',
        body: 'body',
      },
    );

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
      // TODO: Check email sending
    });

    it('should send to managers only if teamId is not provided', async () => {
      const notificationWithManagers = new TestTeamAndMaybeManagerNotification(
        new Date(2024, 3, 30), // 2 day before (normally no managers)
        1,
        notification.category,
        notification.types,
        notification.data,
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
