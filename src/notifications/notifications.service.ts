import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { FirebaseService, TokenMessage } from '../common/modules/firebase';
import { CommonConfig } from '../config';

import {
  Notification,
  NotificationType,
  TeamAndMaybeManagerNotification,
  TeamNotification,
  UserNotification,
} from './entities';
import { TokensService } from './tokens.service';
import { UsersService } from '../users/users/users.service';

import { Role } from '../common/modules/auth';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly firebaseService: FirebaseService,
    @Inject(CommonConfig.KEY)
    private readonly config: ConfigType<typeof CommonConfig>,
    private readonly usersService: UsersService,
  ) {}

  async sendNotification(notification: Notification): Promise<void> {
    if (notification instanceof TeamNotification) {
      await this.sendTeamNotification(notification);
    } else if (notification instanceof UserNotification) {
      await this.sendUserNotification(notification);
    } else {
      this.logger.error(
        `Unknown notification type: ${JSON.stringify(notification)}`,
      );
    }
  }

  private async sendUserNotification(
    notification: UserNotification,
  ): Promise<void> {
    if (notification.types.has(NotificationType.Push)) {
      await this.sendPushNotification(notification);
    }
    if (notification.types.has(NotificationType.Email)) {
      if (!notification.email) {
        const user = await this.usersService.userRepository.findOne({
          select: ['email'],
          loadEagerRelations: false,
          where: { id: notification.userId },
        });
        if (!user) {
          this.logger.error(
            `User with id ${notification.userId} not found for email notification`,
          );
          return;
        }

        notification.email = user.email;
      }
      await this.sendEmailNotification(notification);
    }
  }

  private async sendTeamNotification(
    notification: TeamNotification,
  ): Promise<void> {
    let users = [];

    if (notification instanceof TeamAndMaybeManagerNotification) {
      if (
        notification.daysAfterStartDate >=
          this.config.addManagerToNotificationDelay ||
        !notification.teamId
      ) {
        users = await this.usersService.userRepository.find({
          select: ['id', 'email'],
          loadEagerRelations: false,
          where: {
            roles: {
              role: Role.RegionManager,
              additionalInfo: notification.regionId,
            },
          },
        });

        this.logger.debug(`Adding manager to notification`);
      }

      if (
        notification.daysAfterStartDate >=
          this.config.addEmailToNotificationDelay &&
        !notification.types.has(NotificationType.Email)
      ) {
        notification.types.add(NotificationType.Email);
        this.logger.debug(`Adding email to notification`);
      }
    }

    if (notification.teamId) {
      const teamUsers = await this.usersService.userRepository.find({
        select: ['id', 'email'],
        loadEagerRelations: false,
        where: { team: { id: notification.teamId } },
      });
      for (const user of teamUsers) {
        if (!users.some((u) => u.id === user.id)) {
          users.push(user);
        }
      }
    }

    for (const user of users) {
      await this.sendUserNotification(
        notification.toUserNotification(user.id, user.email),
      );
    }
  }

  private async sendEmailNotification(
    notification: Notification,
  ): Promise<void> {
    // TODO: Implement email sending
    this.logger.debug(
      `Sending email notification:  ${JSON.stringify(notification)}`,
    );
  }

  private async sendPushNotification(
    notification: UserNotification,
  ): Promise<void> {
    const tokens = await this.tokensService.getTokens(notification.userId);

    if (tokens.length === 0) {
      this.logger.debug(`No tokens found for user ${notification.userId}`);
      return;
    }

    const message: TokenMessage = {
      token: '',
      notification: {
        title: notification.notification.title,
        body: notification.notification.body,
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

      this.logger.debug(`Push notification sent to token: ${message.token}`);
    } catch (error) {
      if (error.code === 'messaging/registration-token-not-registered') {
        this.logger.debug(
          `Token not registered, removing from database ${message.token}`,
        );

        await this.tokensService.delete(userId, message.token);
        return;
      }

      this.logger.error(`Error sending push notification: ${error}`);
    }
  }
}
