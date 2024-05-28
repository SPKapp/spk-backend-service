import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseService } from '../common/modules/firebase/firebase.service';
import { CommonConfig } from '../config';

import { NotificationsService } from './notifications.service';
import { TokensService } from './tokens.service';
import { NotificationType } from './entities';

describe(NotificationsService, () => {
  let service: NotificationsService;
  let tokensService: TokensService;
  let firebaseService: FirebaseService;

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
          provide: CommonConfig.KEY,
          useValue: {
            disablePushNotifications: false,
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    tokensService = module.get<TokensService>(TokensService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPushNotification', () => {
    const notification = {
      types: [NotificationType.Push],
      data: {
        testData: 'testData',
      },
      category: 'category',
      userId: 1,
      notification: {
        title: 'title',
        body: 'body',
      },
    };

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
});
