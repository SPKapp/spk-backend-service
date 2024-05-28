import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { FirebaseService, TokenMessage } from '../common/modules/firebase';
import { CommonConfig } from '../config';

import { Notification, NotificationType } from './entities';
import { TokensService } from './tokens.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly firebaseService: FirebaseService,
    @Inject(CommonConfig.KEY)
    private readonly config: ConfigType<typeof CommonConfig>,
  ) {}

  async sendNotification(notification: Notification): Promise<void> {
    if (notification.types.includes(NotificationType.Push)) {
      await this.sendPushNotification(notification);
    }
    if (notification.types.includes(NotificationType.Email)) {
      await this.sendEmailNotification(notification);
    }
  }

  private async sendEmailNotification(
    notification: Notification,
  ): Promise<void> {
    this.logger.debug('Sending email notification', notification);
  }

  private async sendPushNotification(
    notification: Notification,
  ): Promise<void> {
    const tokens = await this.tokensService.getTokens(notification.userId);

    if (tokens.length === 0) {
      this.logger.debug('No tokens found for user', notification.userId);
      return;
    }

    const message: TokenMessage = {
      token: '',
      notification: {
        title: notification.notification.title,
        body: notification.notification.body,
      },
      android: {
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      webpush: {
        fcmOptions: {
          link: 'https://spkdev.galaktyka.me',
        },
        notification: {
          // TODO: Add icon   icon: '',
          requireInteraction: true,
        },
      },
      data: {
        category: notification.category,
        ...notification.data,
      },
    };

    for (const token of tokens) {
      await this.sendPushMessage({ ...message, token }, notification.userId);
    }
  }

  private async sendPushMessage(
    message: TokenMessage,
    userId: number,
  ): Promise<void> {
    try {
      await this.firebaseService.messaging.send(
        message,
        this.config.disablePushNotifications,
      );

      this.logger.debug('Push notification sent to token:', message.token);
    } catch (error) {
      if (error.code === 'messaging/registration-token-not-registered') {
        this.logger.debug(
          'Token not registered, removing from database',
          message.token,
        );

        await this.tokensService.delete(userId, message.token);
        return;
      }

      this.logger.error('Error sending push notification', error);
    }
  }
}
