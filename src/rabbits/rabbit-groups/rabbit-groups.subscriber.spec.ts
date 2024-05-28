import { DataSource, EntityManager, UpdateEvent } from 'typeorm';
import { Mock, mock } from 'ts-jest-mocker';

import { RabbitGroupsSubscriber } from './rabbit-groups.subscriber';
import { RabbitGroup, RabbitGroupStatus } from '../entities';

describe('RabbitGroupsSubscriber', () => {
  let subscriber: RabbitGroupsSubscriber;
  let dataSource: Mock<DataSource>;

  beforeEach(() => {
    dataSource = mock(DataSource);
    Object.defineProperty(dataSource, 'subscribers', { get: () => [] });
    subscriber = new RabbitGroupsSubscriber(dataSource);
  });

  describe('listenTo', () => {
    it('should return RabbitGroup', () => {
      expect(subscriber.listenTo()).toBe(RabbitGroup);
    });
  });

  describe('beforeUpdate', () => {
    let event: Mock<UpdateEvent<RabbitGroup>>;
    let entity: RabbitGroup;

    beforeEach(() => {
      event = mock<UpdateEvent<RabbitGroup>>();
    });

    it('should set adoption date when status is adopted', async () => {
      event.entity = entity = new RabbitGroup({
        id: 1,
        status: RabbitGroupStatus.Adopted,
        adoptionDate: null,
      });

      await subscriber.beforeUpdate(event);

      expect(entity.adoptionDate).not.toBeNull();
    });

    it('should skip setting adoption date when status is adopted and date is set', async () => {
      event.entity = entity = new RabbitGroup({
        id: 1,
        status: RabbitGroupStatus.Adopted,
        adoptionDate: new Date(),
      });

      await subscriber.beforeUpdate(event);

      expect(entity.adoptionDate).not.toBeNull();
    });

    it('should not remove adoption date when status is adoptable', async () => {
      event.entity = entity = new RabbitGroup({
        id: 1,
        status: RabbitGroupStatus.Adoptable,
        adoptionDate: new Date(),
      });

      await subscriber.beforeUpdate(event);

      expect(entity.adoptionDate).not.toBeNull();
    });

    it('should remove adoption date when status is not adopted', async () => {
      event.entity = entity = new RabbitGroup({
        id: 1,
        status: RabbitGroupStatus.InTreatment,
        adoptionDate: new Date(),
      });

      await subscriber.beforeUpdate(event);

      expect(entity.adoptionDate).toBeNull();
    });

    it('should skip removing adoption date when status is not adopted and date is not set', async () => {
      event.entity = entity = new RabbitGroup({
        id: 1,
        status: RabbitGroupStatus.Adoptable,
        adoptionDate: null,
      });

      await subscriber.beforeUpdate(event);

      expect(entity.adoptionDate).toBeNull();
    });
  });

  describe('afterUpdate', () => {
    let event: Mock<UpdateEvent<RabbitGroup>>;
    let manager: Mock<EntityManager>;
    let entity: RabbitGroup;

    beforeEach(() => {
      event = mock<UpdateEvent<RabbitGroup>>();
      event.manager = manager = mock<EntityManager>();
      manager.save.mockImplementation(async (entity) => entity);

      event.entity = entity = new RabbitGroup({
        id: 1,
      });
      event.databaseEntity = new RabbitGroup({
        id: 1,
      });
    });

    it('should skip status update', async () => {
      const event = mock<UpdateEvent<RabbitGroup>>();
      event.queryRunner.data = { withoutStatus: true };

      await subscriber.afterUpdate(event);

      expect(manager.find).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('should update status of all rabbits in the group', async () => {
      entity.status = RabbitGroupStatus.Adopted;

      jest
        .spyOn(manager, 'find')
        .mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

      await subscriber.afterUpdate(event);

      expect(manager.save).toHaveBeenCalledWith(
        [
          { id: 1, status: RabbitGroupStatus.Adopted },
          { id: 2, status: RabbitGroupStatus.Adopted },
          { id: 3, status: RabbitGroupStatus.Adopted },
        ],
        {
          data: { withoutStatus: true },
        },
      );
    });
  });
});
