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
 * @param emailData - Data for email notifications - subject, template
 *
 */
export abstract class Notification {
  category: string;
  types: Set<NotificationType>;
  data: {
    [key: string]: string;
  };
  notification?: {
    title: string;
    body: string;
  };
  emailData?: {
    subject: string;
    template: string;
    link?: string;
  };
}

/**
 * Base class for notifications sent to a single user
 */
export abstract class UserNotification extends Notification {
  userId?: number;
  email?: string;
}

/**
 * Base class for notifications sent to a team
 */
export abstract class TeamNotification extends Notification {
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
    emailData: { subject: string; template: string; link?: string },
    teamId?: number,
    notification?: { title: string; body: string },
  ) {
    super();

    this.category = category;
    this.types = types;
    this.data = data;
    this.notification = notification;
    this.teamId = teamId;
    this.emailData = emailData;

    this.daysAfterStartDate = Math.floor(
      Math.abs(new Date().getTime() - startDate.getTime()) / millisecondsInDay,
    );
    this.regionId = regionId;
  }

  daysAfterStartDate: number;
  regionId: number;
}

/**
 * *****************************************
 * ********** FINAL NOTIFICATIONS **********
 * *****************************************
 */

/**
 * Notification for a new rabbit group assigned to the team
 */
export class NotificationGroupAssigned extends TeamNotification {
  constructor(teamId: number, groupId: number) {
    super();

    this.category = 'groupAssigned';
    this.types = new Set<NotificationType>([
      NotificationType.Email,
      NotificationType.Push,
    ]);
    this.data = {
      groupId: groupId.toString(),
    };
    this.notification = {
      title: 'Nowy królik',
      body: 'Przypisano do Ciebie nową grupę królików',
    };
    this.teamId = teamId;

    this.emailData = {
      subject: 'Przypisano do Ciebie nową grupę królików',
      template: 'notifications/group-assigned',
      link: `/#/rabbitGroup/${groupId}`,
    };
  }
}

/**
 * Notification for a new rabbit assigned to the user
 */
export class NotificationRabbitAssigned extends TeamNotification {
  constructor(teamId: number, rabbitId: number) {
    super();

    this.category = 'rabbitAssigned';
    this.types = new Set<NotificationType>([
      NotificationType.Email,
      NotificationType.Push,
    ]);
    this.data = {
      rabbitId: rabbitId.toString(),
    };
    this.notification = {
      title: 'Nowy królik',
      body: 'Przypisano do Ciebie nowego królika',
    };
    this.teamId = teamId;

    this.emailData = {
      subject: 'Przypisano do Ciebie nowego królika',
      template: 'notifications/rabbit-assigned',
      link: `/#/rabbit/${rabbitId}`,
    };
  }
}

/**
 * Notification for a rabbit moved to another group assigned to the same team
 */
export class NotificationRabitMoved extends TeamNotification {
  constructor(teamId: number, rabbitId: number) {
    super();

    this.category = 'rabbitMoved';
    this.types = new Set<NotificationType>([NotificationType.Push]);
    this.data = {
      rabbitId: rabbitId.toString(),
    };
    this.notification = {
      title: 'Przeniesienie królika',
      body: 'Przeniesiono twojego królika do innej grupy',
    };
    this.teamId = teamId;
  }
}

/**
 * Notification for a rabbit with not proper admission date or status
 */
export class NotificationAdmissionToConfirm extends TeamAndMaybeManagerNotification {
  constructor(
    statdDate: Date,
    regionId: number,
    rabbitId: number,
    inFuture: boolean,
    name?: string,
    teamId?: number,
  ) {
    super(
      statdDate,
      regionId,
      'admissionToConfirm',
      new Set<NotificationType>([NotificationType.Push]),
      {
        rabbitId: rabbitId.toString(),
        inFuture: inFuture.toString(),
        name: name ?? '',
      },
      {
        subject: inFuture
          ? 'Problem z datą przyjęcia'
          : 'Potwierdzenie przyjęcia królika',
        template: 'notifications/admission-to-confirm',
        link: `/#/rabbit/${rabbitId}`,
      },
      teamId,
      inFuture
        ? {
            title: 'Problem z datą przyjęcia',
            body: `Data przyjęcia ${name} jest w przyszłości, a status inny niż 'Nieodebrany', prosimy o poprawę danych`,
          }
        : {
            title: 'Potwierdzenie przyjęcia',
            body: `Upłynął termin przyjęcia ${name}, prosimy o jego potwierdzenie`,
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
        name: name ?? '',
      },
      {
        subject: 'Potwierdzenie adopcji',
        template: 'notifications/adoption-to-confirm',
        link: `/#/rabbitGroup/${groupId}`,
      },
      teamId,
      {
        title: 'Potwierdzenie adopcji',
        body: `Upłynął termin adopcji ${name}, prosimy o jej potwierdzenie`,
      },
    );
  }
}

export class NotificationNearVetVisit extends TeamNotification {
  constructor(teamId: number, rabbitId: number, noteId: number, name?: string) {
    super();

    this.category = 'nearVetVisit';
    this.types = new Set<NotificationType>([NotificationType.Push]);
    this.data = {
      rabbitId: rabbitId.toString(),
      noteId: noteId.toString(),
    };
    this.notification = {
      title: 'Wizyta u weterynarza',
      body: 'Nadchodzi termin wizyty u weterynarza',
    };
    this.teamId = teamId;

    if (name) {
      this.notification.body += ` z ${name}`;
      this.data['rabbitName'] = name;
    }
  }
}

export class NotificationVetVisitEnded extends TeamNotification {
  constructor(teamId: number, rabbitId: number, noteId: number, name?: string) {
    super();

    this.category = 'vetVisitEnd';
    this.types = new Set<NotificationType>([NotificationType.Push]);
    this.data = {
      rabbitId: rabbitId.toString(),
      noteId: noteId.toString(),
    };
    this.notification = {
      title: 'Zakończono wizytę u weterynarza',
      body: 'Uzupełnij informacje o wizycie u weterynarza',
    };
    this.teamId = teamId;

    if (name) {
      this.notification.body += ` z ${name}`;
      this.data['rabbitName'] = name;
    }
  }
}
