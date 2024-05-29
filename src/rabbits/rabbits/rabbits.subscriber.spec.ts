import { DataSource, EntityManager, UpdateEvent } from 'typeorm';
import { Mock, mock } from 'ts-jest-mocker';

import { RabbitsSubscriber } from './rabbits.subscriber';
import {
  Rabbit,
  RabbitGroup,
  RabbitGroupStatus,
  RabbitStatus,
} from '../entities';
import { ConflictException } from '@nestjs/common';

describe('RabbitsSubscriber', () => {
  let subscriber: RabbitsSubscriber;
  let dataSource: Mock<DataSource>;

  beforeEach(() => {
    dataSource = mock(DataSource);
    Object.defineProperty(dataSource, 'subscribers', { get: () => [] });
    subscriber = new RabbitsSubscriber(dataSource);
  });

  describe('listenTo', () => {
    it('should return Rabbit', () => {
      expect(subscriber.listenTo()).toBe(Rabbit);
    });
  });

  describe('beforeUpdate', () => {
    let event: Mock<UpdateEvent<Rabbit>>;
    let entity: Rabbit;
    let date: Date;

    beforeEach(() => {
      event = mock<UpdateEvent<Rabbit>>();
      event.entity = entity = new Rabbit();
      date = new Date(2024, 4, 1);

      jest.useFakeTimers();
      jest.setSystemTime(date);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not set admissionDate', async () => {
      entity.status = RabbitStatus.Incoming;

      await subscriber.beforeUpdate(event);

      expect(entity.admissionDate).toBeUndefined();
    });

    it('should not change admissionDate', async () => {
      entity.status = RabbitStatus.Adoptable;
      entity.admissionDate = new Date(2024, 1, 1);

      await subscriber.beforeUpdate(event);

      expect(entity.admissionDate).toEqual(new Date(2024, 1, 1));
    });

    it('should set admissionDate', async () => {
      entity.status = RabbitStatus.Adoptable;

      await subscriber.beforeUpdate(event);

      expect(entity.admissionDate).toEqual(date);
    });

    it('should not change admissionDate if already set', async () => {
      entity.status = RabbitStatus.Adoptable;
      entity.admissionDate = new Date(2024, 1, 1);

      await subscriber.beforeUpdate(event);

      expect(entity.admissionDate).toEqual(new Date(2024, 1, 1));
    });
  });

  describe('afterUpdate', () => {
    let event: Mock<UpdateEvent<Rabbit>>;
    let manager: Mock<EntityManager>;
    let entity: Rabbit;
    let databaseEntity: Rabbit;

    beforeEach(() => {
      event = mock<UpdateEvent<Rabbit>>();
      event.manager = manager = mock<EntityManager>();
      manager.save.mockImplementation(async (entity) => entity);

      event.entity = entity = new Rabbit({
        id: 1,
        rabbitGroup: new RabbitGroup({
          id: 1,
        }),
      });
      event.databaseEntity = databaseEntity = new Rabbit({
        id: 1,
        rabbitGroup: new RabbitGroup({
          id: 1,
        }),
      });
    });

    it('should skip status update', async () => {
      const event = mock<UpdateEvent<Rabbit>>();
      event.queryRunner.data = { withoutStatus: true };

      await subscriber.afterUpdate(event);

      expect(manager.find).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    describe('when rabbit status is changed', () => {
      it('should set RabbitStatus.Deceased', async () => {
        entity.status = RabbitStatus.Deceased;
        jest.spyOn(manager, 'find').mockResolvedValue([]);

        await subscriber.afterUpdate(event);

        expect(manager.save).toHaveBeenCalledWith(
          new RabbitGroup({
            ...entity.rabbitGroup,
            status: RabbitGroupStatus.Deceased,
          }),
          { data: { withoutStatus: true } },
        );
      });
      it('should throw an error if not all rabbits are deceased', async () => {
        entity.status = RabbitStatus.Deceased;
        jest.spyOn(manager, 'find').mockResolvedValue([
          new Rabbit({
            id: 2,
            status: RabbitStatus.InTreatment,
          }),
        ]);

        await expect(subscriber.afterUpdate(event)).rejects.toThrow(
          new ConflictException('All rabbits in the group must be deceased'),
        );
      });

      it('should set RabbitStatus.Adopted', async () => {
        entity.status = RabbitStatus.Adopted;
        jest.spyOn(manager, 'find').mockResolvedValue([]);

        await subscriber.afterUpdate(event);

        expect(manager.save).toHaveBeenCalledWith(
          new RabbitGroup({
            ...entity.rabbitGroup,
            status: RabbitGroupStatus.Adopted,
          }),
          { data: { withoutStatus: true } },
        );
      });

      it('should throw an error if not all rabbits are adopted', async () => {
        entity.status = RabbitStatus.Adopted;
        jest.spyOn(manager, 'find').mockResolvedValue([
          new Rabbit({
            id: 2,
            status: RabbitStatus.InTreatment,
          }),
        ]);

        await expect(subscriber.afterUpdate(event)).rejects.toThrow(
          new ConflictException('All rabbits in the group must be adopted'),
        );
      });

      it('should set RabbitStatus.Adoptable', async () => {
        entity.status = RabbitStatus.Adoptable;
        jest.spyOn(manager, 'find').mockResolvedValue([
          new Rabbit({
            id: 2,
            status: RabbitStatus.Adoptable,
          }),
        ]);

        await subscriber.afterUpdate(event);

        expect(manager.save).toHaveBeenCalledWith(
          new RabbitGroup({
            ...entity.rabbitGroup,
            status: RabbitGroupStatus.Adoptable,
          }),
          { data: { withoutStatus: true } },
        );
      });

      it('should set RabbitStatus.InTreatment', async () => {
        entity.status = RabbitStatus.InTreatment;
        jest.spyOn(manager, 'find').mockResolvedValue([]);

        await subscriber.afterUpdate(event);

        expect(manager.save).toHaveBeenCalledWith(
          new RabbitGroup({
            ...entity.rabbitGroup,
            status: RabbitGroupStatus.InTreatment,
          }),
          { data: { withoutStatus: true } },
        );
      });

      it('should set RabbitStatus.InTreatment - with different state', async () => {
        entity.status = RabbitStatus.InTreatment;
        jest.spyOn(manager, 'find').mockResolvedValue([
          new Rabbit({
            id: 2,
            status: RabbitStatus.Incoming,
          }),
        ]);

        await subscriber.afterUpdate(event);

        expect(manager.save).toHaveBeenCalledWith(
          new RabbitGroup({
            ...entity.rabbitGroup,
            status: RabbitGroupStatus.InTreatment,
          }),
          { data: { withoutStatus: true } },
        );
      });

      it('should set RabbitStatus.Incoming', async () => {
        entity.status = RabbitStatus.Incoming;
        jest.spyOn(manager, 'find').mockResolvedValue([]);

        await subscriber.afterUpdate(event);

        expect(manager.save).toHaveBeenCalledWith(
          new RabbitGroup({
            ...entity.rabbitGroup,
            status: RabbitGroupStatus.Incoming,
          }),
          { data: { withoutStatus: true } },
        );
      });

      it('should throw an error if RabbitStatus is not recognized', async () => {
        entity.status = RabbitStatus.Adoptable;
        jest.spyOn(manager, 'find').mockResolvedValue([
          new Rabbit({
            id: 2,
            status: RabbitStatus.Incoming,
          }),
        ]);

        await expect(subscriber.afterUpdate(event)).rejects.toThrow(
          new ConflictException('Cannot determine the group status'),
        );
      });
    });

    describe('when rabbit group is changed', () => {
      it('should update the old rabbit group status', async () => {
        entity.rabbitGroup.id = 2;
        databaseEntity.status = RabbitStatus.Adoptable;
        entity.status = RabbitStatus.Adoptable;

        jest
          .spyOn(manager, 'find')
          .mockResolvedValueOnce([
            new Rabbit({
              id: 2,
              status: RabbitStatus.Adoptable,
            }),
          ])
          .mockResolvedValueOnce([]);

        await subscriber.afterUpdate(event);

        expect(manager.save).toHaveBeenNthCalledWith(
          1,
          new RabbitGroup({
            ...databaseEntity.rabbitGroup,
            status: RabbitGroupStatus.Adoptable,
          }),
          { data: { withoutStatus: true } },
        );
        expect(manager.save).toHaveBeenNthCalledWith(
          2,
          new RabbitGroup({
            ...entity.rabbitGroup,
            status: RabbitGroupStatus.Adoptable,
          }),
          { data: { withoutStatus: true } },
        );
      });

      it('should not double calculate new group', async () => {
        entity.rabbitGroup.id = 2;
        databaseEntity.status = RabbitStatus.InTreatment;
        entity.status = RabbitStatus.Adoptable;

        jest
          .spyOn(manager, 'find')
          .mockResolvedValueOnce([
            new Rabbit({
              id: 2,
              status: RabbitStatus.Adoptable,
            }),
          ])
          .mockResolvedValueOnce([]);

        await subscriber.afterUpdate(event);

        expect(manager.save).toHaveBeenNthCalledWith(
          1,
          new RabbitGroup({
            ...databaseEntity.rabbitGroup,
            status: RabbitGroupStatus.Adoptable,
          }),
          { data: { withoutStatus: true } },
        );
        expect(manager.save).toHaveBeenNthCalledWith(
          2,
          new RabbitGroup({
            ...entity.rabbitGroup,
            status: RabbitGroupStatus.Adoptable,
          }),
          { data: { withoutStatus: true } },
        );
      });
    });
  });
});
