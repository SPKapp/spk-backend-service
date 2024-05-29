import { ConflictException, Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  Not,
  UpdateEvent,
} from 'typeorm';

import {
  Rabbit,
  RabbitGroup,
  RabbitGroupStatus,
  RabbitStatus,
} from '../entities';

@EventSubscriber()
export class RabbitsSubscriber implements EntitySubscriberInterface<Rabbit> {
  private readonly logger = new Logger(RabbitsSubscriber.name);

  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Rabbit;
  }

  async beforeUpdate(event: UpdateEvent<Rabbit>): Promise<any> {
    if (
      event.entity.status !== RabbitStatus.Incoming &&
      !event.entity.admissionDate
    ) {
      this.logger.debug('Setting admission date');
      event.entity.admissionDate = new Date();
    }
  }

  /**
   * Update the rabbit group status when the rabbit status or group is changed
   *
   * Set 'withoutStatus' in the query runner data to prevent recalculation
   * of the rabbit group status, typically when the rabbit group status is updated
   * to prevent infinite loop
   */
  async afterUpdate(event: UpdateEvent<Rabbit>): Promise<void> {
    // Prevent infinite loop
    if (!event.queryRunner.data?.withoutStatus) {
      this.logger.debug('Updating rabbit group status');

      if (event.databaseEntity.rabbitGroup.id !== event.entity.rabbitGroup.id) {
        // When the rabbit group is changed, update the rabbit group status

        // Update the old rabbit group status
        event.databaseEntity.rabbitGroup.status =
          await this.calculateRabbitGroupStatus(
            event,
            event.databaseEntity.rabbitGroup.id,
            false,
          );
        await event.manager.save<RabbitGroup>(
          new RabbitGroup(event.databaseEntity.rabbitGroup),
          {
            data: { withoutStatus: true },
          },
        );

        // Update the new rabbit group status
        event.entity.rabbitGroup.status = await this.calculateRabbitGroupStatus(
          event,
          event.entity.rabbitGroup.id,
          true,
        );
        await event.manager.save<RabbitGroup>(
          new RabbitGroup(event.entity.rabbitGroup),
          {
            data: { withoutStatus: true },
          },
        );
      } else if (event.databaseEntity.status !== event.entity.status) {
        // When the rabbit status is changed, update the rabbit group status

        event.entity.rabbitGroup.status = await this.calculateRabbitGroupStatus(
          event,
          event.entity.rabbitGroup.id,
          true,
        );
        await event.manager.save<RabbitGroup>(
          new RabbitGroup(event.entity.rabbitGroup),
          {
            data: { withoutStatus: true },
          },
        );
      }
    } else {
      this.logger.debug('Skipping rabbit group status update');
    }
  }

  private async calculateRabbitGroupStatus(
    event: UpdateEvent<Rabbit>,
    groupId: number,
    withCurrent: boolean = true,
  ): Promise<RabbitGroupStatus> {
    const rabbits = await event.manager.find(Rabbit, {
      select: ['id', 'status'],
      loadEagerRelations: false,
      where: {
        id: Not(event.entity.id),
        rabbitGroup: { id: groupId },
      },
    });

    if (withCurrent) rabbits.push(new Rabbit(event.entity));

    if (rabbits.some((rabbit) => rabbit.status === RabbitStatus.Deceased)) {
      if (rabbits.every((rabbit) => rabbit.status === RabbitStatus.Deceased)) {
        return RabbitGroupStatus.Deceased;
      }
      throw new ConflictException('All rabbits in the group must be deceased', {
        description: 'not-all-deceased',
      });
    }
    if (rabbits.some((rabbit) => rabbit.status === RabbitStatus.Adopted)) {
      if (rabbits.every((rabbit) => rabbit.status === RabbitStatus.Adopted)) {
        return RabbitGroupStatus.Adopted;
      }
      throw new ConflictException('All rabbits in the group must be adopted', {
        description: 'not-all-adopted',
      });
    }
    if (rabbits.every((rabbit) => rabbit.status === RabbitStatus.Adoptable)) {
      return RabbitGroupStatus.Adoptable;
    }
    if (rabbits.some((rabbit) => rabbit.status === RabbitStatus.InTreatment)) {
      return RabbitGroupStatus.InTreatment;
    }
    if (rabbits.every((rabbit) => rabbit.status === RabbitStatus.Incoming)) {
      return RabbitGroupStatus.Incoming;
    }

    throw new ConflictException('Cannot determine the group status', {
      description: 'unavailable-group-status',
    });
  }
}
