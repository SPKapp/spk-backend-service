import { millisecondsInDay } from '../../config';

export enum NotificationType {
  Email,
  Push,
}

/**
 * Base class for all notifications
 *
 * @param userId - ID of the user to whom the notification is sent - can be a single ID or an array of IDs
 * @param category - Category of the notification - should be defined by each final class
 * @param types - Types of the notification - should be defined by each final class, not all types may be supported for each category
 * @param data - Data to be sent with the notification - specific to each category
 * @param notification - Notification data - title, body, imageUrl, can be used for push notifications
 *
 */
export abstract class Notification {
  constructor(
    category: string,
    types: Set<NotificationType>,
    data: {
      [key: string]: string;
    },
    notification?: {
      title: string;
      body: string;
    },
  ) {
    this.category = category;
    this.types = types;
    this.data = data;
    this.notification = notification;
  }

  category: string;
  types: Set<NotificationType>;
  data: {
    [key: string]: string;
  };
  notification?: {
    title: string;
    body: string;
  };
}

/**
 * Base class for notifications sent to a single user
 */
export abstract class UserNotification extends Notification {
  constructor(
    category: string,
    types: Set<NotificationType>,
    data: { [key: string]: string },
    notification?: { title: string; body: string },
    userId?: number,
    email?: string,
  ) {
    super(category, types, data, notification);
    this.userId = userId;
    this.email = email;
  }

  userId?: number;
  email?: string;
}

/**
 * Base class for notifications sent to a team
 */
export abstract class TeamNotification extends Notification {
  constructor(
    teamId: number,
    category: string,
    types: Set<NotificationType>,
    data: { [key: string]: string },
    notification?: { title: string; body: string },
  ) {
    super(category, types, data, notification);
    this.teamId = teamId;
  }

  teamId: number;

  toUserNotification(userId?: number, email?: string): UserNotification {
    return {
      ...this,
      userId,
      email,
    };
  }
}

/**
 * Base class for notifications sent to a team and may escalate to the manager
 */
export abstract class TeamAndMaybeManagerNotification extends TeamNotification {
  constructor(
    startDate: Date,
    regionId: number,
    category: string,
    types: Set<NotificationType>,
    data: { [key: string]: string },
    teamId?: number,
    notification?: { title: string; body: string },
  ) {
    super(teamId, category, types, data, notification);

    this.daysAfterStartDate = Math.floor(
      Math.abs(new Date().getTime() - startDate.getTime()) / millisecondsInDay,
    );
    this.regionId = regionId;
  }

  daysAfterStartDate: number;
  regionId: number;
}

/**
 * Notification for a new rabbit group assigned to the user
 */
export class NotificationGroupAssigned extends UserNotification {
  constructor(userId: number, groupId: number) {
    super(
      'groupAssigned',
      new Set<NotificationType>([
        NotificationType.Email,
        NotificationType.Push,
      ]),
      {
        groupId: groupId.toString(),
      },
      {
        title: 'Nowy królik',
        body: 'Przypisano do Ciebie nową grupę królików',
      },
      userId,
    );
  }
}

/**
 * Notification for a new rabbit assigned to the user
 */
export class NotificationRabbitAssigned extends TeamNotification {
  constructor(teamId: number, rabbitId: number) {
    super(
      teamId,
      'rabbitAssigned',
      new Set<NotificationType>([
        NotificationType.Email,
        NotificationType.Push,
      ]),
      {
        rabbitId: rabbitId.toString(),
      },
      {
        title: 'Nowy królik',
        body: 'Przypisano do Ciebie nowego królika',
      },
    );
  }
}

/**
 * Notification for a rabbit moved to another group assigned to the same team
 */
export class NotificationRabitMoved extends TeamNotification {
  constructor(teamId: number, rabbitId: number) {
    super(
      teamId,
      'rabbitMoved',
      new Set<NotificationType>([NotificationType.Push]),
      {
        rabbitId: rabbitId.toString(),
      },
      {
        title: 'Przeniesienie królika',
        body: 'Przeniesiono twojego królika do innej grupy',
      },
    );
  }
}

/**
 * Notification for a rabbit group with not proper adoption date or status
 */
export class NotificationAdoptionToConfirm extends TeamAndMaybeManagerNotification {
  constructor(
    statdDate: Date,
    regionId: number,
    groupId: number,
    name?: string,
    teamId?: number,
  ) {
    super(
      statdDate,
      regionId,
      'adoptionToConfirm',
      new Set<NotificationType>([NotificationType.Push]),
      {
        groupId: groupId.toString(),
      },
      teamId,
      {
        title: 'Potwierdzenie adopcji',
        body: `Upłynął termin adopcji ${name}, prosimy o jej potwierdzenie`,
      },
    );
  }
}
