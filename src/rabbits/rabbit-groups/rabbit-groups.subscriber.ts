import { Logger } from '@nestjs/common';
import { DataSource, EventSubscriber, UpdateEvent } from 'typeorm';

import { Rabbit, RabbitGroup, RabbitGroupStatus } from '../entities';

@EventSubscriber()
export class RabbitGroupsSubscriber {
  private readonly logger = new Logger(RabbitGroupsSubscriber.name);

  constructor(private readonly dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return RabbitGroup;
  }

  /**
   * Set the adoption date when the rabbit group is adopted and remove it when it is not
   */
  async beforeUpdate(event: UpdateEvent<RabbitGroup>): Promise<void> {
    if (event.entity.status === RabbitGroupStatus.Adopted) {
      if (event.entity.adoptionDate === null) {
        this.logger.debug('Setting adoptedAt date');
        event.entity.adoptionDate = new Date();
      }
    } else {
      if (event.entity.adoptionDate !== null) {
        this.logger.debug('Removing adoptedAt date');
        event.entity.adoptionDate = null;
      }
    }
  }

  /**
   * Update the rabbit group status when the rabbit group is changed
   *
   * Set 'withoutStatus' in the query runner data to prevent set status
   * to all rabbit in the group, typically when the rabbit status is updated
   * to prevent infinite loop
   */
  async afterUpdate(event: UpdateEvent<RabbitGroup>): Promise<void> {
    // Prevent infinite loop
    if (!event.queryRunner.data?.withoutStatus) {
      if (event.databaseEntity.status !== event.entity.status) {
        this.logger.debug('Updating status of all rabbits in the group');

        const rabbits = await event.manager.find(Rabbit, {
          select: ['id'],
          loadEagerRelations: false,
          where: {
            rabbitGroup: { id: event.entity.id },
          },
        });
        rabbits.forEach((rabbit) => {
          rabbit.status = event.entity.status;
        });

        await event.manager.save<Rabbit>(rabbits, {
          data: { withoutStatus: true },
        });
      }
    } else {
      this.logger.debug('Skipping status update of all rabbits in the group');
    }
  }
}
