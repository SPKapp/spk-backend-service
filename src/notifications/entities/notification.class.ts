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
    userId: number,
    category: string,
    types: NotificationType[],
    data: {
      [key: string]: string;
    },
    notification?: {
      title: string;
      body: string;
    },
  ) {
    this.userId = userId;
    this.category = category;
    this.types = types;
    this.data = data;
    this.notification = notification;
  }

  userId: number;
  category: string;
  types: NotificationType[];
  data: {
    [key: string]: string;
  };
  notification?: {
    title: string;
    body: string;
  };
}

/**
 * Notification for a new rabbit group assigned to the user
 */
export class NotificationGroupAssigned extends Notification {
  constructor(userId: number, groupId: number) {
    super(
      userId,
      'groupAssigned',
      [NotificationType.Email, NotificationType.Push],
      {
        groupId: groupId.toString(),
      },
      {
        title: 'Nowy królik',
        body: 'Przypisano do Ciebie nową grupę królików',
      },
    );
  }
}
