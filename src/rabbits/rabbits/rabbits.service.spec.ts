import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CronConfig } from '../../config';
import { RabbitsService } from './rabbits.service';
import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';
import {
  NotificationAdmissionToConfirm,
  NotificationRabbitAssigned,
  NotificationRabitMoved,
  NotificationsService,
} from '../../notifications';
import { Rabbit, RabbitGroup, AdmissionType, RabbitStatus } from '../entities';
import { Region } from '../../common/modules/regions/entities';
import { Team } from '../../users/entities/team.entity';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => jest.fn(),
}));

describe('RabbitsService', () => {
  let service: RabbitsService;
  let rabbitGroupsService: RabbitGroupsService;
  let notificationsService: NotificationsService;
  let rabbitRepository: Repository<Rabbit>;
  let queryBuilder: any;

  const rabbits = [
    new Rabbit({
      id: 1,
      name: 'Rabbit 1',
      admissionType: AdmissionType.Found,
      color: 'White',
      rabbitGroup: new RabbitGroup({
        id: 1,
        rabbits: new Promise((resolve) => resolve([])),
      }),
    }),
    new Rabbit({
      id: 1,
      name: 'Rabbit 1',
      rabbitGroup: new RabbitGroup({
        id: 2,
        rabbits: new Promise((resolve) => resolve([new Rabbit({ id: 2 })])),
      }),
    }),
  ];

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(() => rabbits[0]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitsService,
        {
          provide: RabbitGroupsService,
          useValue: {
            create: jest.fn(
              () => new RabbitGroup({ id: rabbits[0].rabbitGroup.id }),
            ),
            findOne: jest.fn((id) => new RabbitGroup({ id })),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Rabbit),
          useValue: {
            save: jest.fn(() => rabbits[0]),
            find: jest.fn(),
            findOneBy: jest.fn(() => rabbits[0]),
            exists: jest.fn(),
            softRemove: jest.fn(() => ({ id: 1 })),
            manager: {
              createQueryBuilder: jest.fn(() => queryBuilder),
            },
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
        {
          provide: CronConfig.KEY,
          useValue: {
            checkAdmissionState: '0 0 0 * * *',
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            addCronJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitsService>(RabbitsService);
    rabbitGroupsService = module.get<RabbitGroupsService>(RabbitGroupsService);
    rabbitRepository = module.get<Repository<Rabbit>>(
      getRepositoryToken(Rabbit),
    );
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should create a new rabbit, with new group', async () => {
      await expect(
        service.create({ ...rabbits[0], regionId: 1 }),
      ).resolves.toEqual(rabbits[0]);

      expect(rabbitGroupsService.create).toHaveBeenCalledWith(1);
    });

    it('should create a new rabbit, with existing group', async () => {
      await expect(
        service.create({ ...rabbits[0], rabbitGroupId: 1 }),
      ).resolves.toEqual(rabbits[0]);

      expect(rabbitGroupsService.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should return a rabbit by id', () => {
      expect(service.findOne(1)).resolves.toEqual(rabbits[0]);

      expect(queryBuilder.where).toHaveBeenCalledWith('rabbit.id = :id', {
        id: rabbits[0].id,
      });
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should return null', () => {
      jest.spyOn(queryBuilder, 'getOne').mockResolvedValue(null);
      expect(service.findOne(1, undefined, [1])).resolves.toBeNull();

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'team.id IN (:...teamsIds)',
        {
          teamsIds: [1],
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
    });

    it('should return a rabbit by id with regionId and teamId filter', () => {
      expect(service.findOne(1, [1], [1])).resolves.toEqual(rabbits[0]);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'region.id IN (:...regionsIds)',
        {
          regionsIds: [1],
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'team.id IN (:...teamsIds)',
        {
          teamsIds: [1],
        },
      );
    });
  });

  describe('exists', () => {
    it('should be defined', () => {
      expect(service.exists).toBeDefined();
    });

    it('should return true if rabbit exists', async () => {
      jest.spyOn(rabbitRepository, 'exists').mockResolvedValue(true);

      await expect(service.exists(1)).resolves.toBeTruthy();

      expect(rabbitRepository.exists).toHaveBeenCalledWith({
        loadEagerRelations: false,
        where: {
          id: 1,
          rabbitGroup: {
            region: { id: undefined },
            team: { id: undefined },
          },
        },
      });
    });

    it('should return false if rabbit does not exist', async () => {
      jest.spyOn(rabbitRepository, 'exists').mockResolvedValue(false);

      await expect(service.exists(1)).resolves.toBeFalsy();

      expect(rabbitRepository.exists).toHaveBeenCalledWith({
        loadEagerRelations: false,
        where: {
          id: 1,
          rabbitGroup: {
            region: { id: undefined },
            team: { id: undefined },
          },
        },
      });
    });

    it('should return true if rabbit exists with regionId and teamId filter', async () => {
      jest.spyOn(rabbitRepository, 'exists').mockResolvedValue(true);

      await expect(service.exists(1, [1], [2])).resolves.toBeTruthy();

      expect(rabbitRepository.exists).toHaveBeenCalledWith({
        loadEagerRelations: false,
        where: {
          id: 1,
          rabbitGroup: {
            region: { id: In([1]) },
            team: { id: In([2]) },
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should be defined', () => {
      expect(service.update).toBeDefined();
    });

    it('should update a rabbit', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(rabbits[0]);

      const updatedRabbit = { ...rabbits[0], name: 'Updated Rabbit 1' };
      await expect(
        service.update(
          rabbits[0].id,
          {
            id: rabbits[0].id,
            name: 'Updated Rabbit 1',
          },
          true,
        ),
      ).resolves.toEqual(updatedRabbit);

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: undefined,
          },
          team: {
            id: undefined,
          },
        },
      });
      expect(rabbitRepository.save).toHaveBeenCalledWith({
        ...rabbits[0],
        name: 'Updated Rabbit 1',
      });
    });

    it('should throw NotFoundException if rabbit not found', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.update(
          rabbits[0].id,
          {
            id: rabbits[0].id,
            name: 'Updated Rabbit 1',
          },
          true,
        ),
      ).rejects.toThrow(new NotFoundException('Rabbit not found'));
    });

    it('should update a rabbit group with regionId ad teamId filter', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(rabbits[1]);

      const updatedRabbit = { ...rabbits[1], name: 'Updated Rabbit 1' };
      await expect(
        service.update(
          rabbits[1].id,
          {
            id: rabbits[1].id,
            name: 'Updated Rabbit 1',
          },
          true,
          [1],
          [1],
        ),
      ).resolves.toEqual(updatedRabbit);

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: In([1]),
          },
          team: {
            id: In([1]),
          },
        },
      });
      expect(rabbitRepository.save).toHaveBeenCalledWith({
        ...rabbits[1],
        name: 'Updated Rabbit 1',
      });
    });

    it('should not update privileged fields', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(rabbits[0]);

      await expect(
        service.update(
          rabbits[0].id,
          {
            id: rabbits[0].id,
            name: 'Updated Rabbit 1',
          },
          false,
        ),
      ).resolves.toEqual(rabbits[0]);

      expect(rabbitRepository.save).toHaveBeenCalledWith(rabbits[0]);
    });
  });

  describe('remove', () => {
    it('should be defined', () => {
      expect(service.remove).toBeDefined();
    });

    it('should remove a rabbit and rabbitGroup', async () => {
      await expect(service.remove(rabbits[0].id)).resolves.toEqual({ id: 1 });

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: undefined,
          },
        },
      });
      expect(rabbitRepository.softRemove).toHaveBeenCalledWith(rabbits[0]);
      expect(rabbitGroupsService.remove).toHaveBeenCalledWith(1);
    });

    it('should remove a rabbit without removing rabbitGroup', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(rabbits[1]);

      await expect(service.remove(rabbits[1].id)).resolves.toEqual({ id: 1 });

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: undefined,
          },
        },
      });
      expect(rabbitRepository.softRemove).toHaveBeenCalledWith(rabbits[1]);
      expect(rabbitGroupsService.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if rabbit not found', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.remove(rabbits[0].id, [1])).rejects.toThrow(
        new NotFoundException('Rabbit not found'),
      );

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: In([1]),
          },
        },
      });
    });
  });

  describe('updateRabbitGroup', () => {
    const rabbit = new Rabbit({
      id: 1,
      rabbitGroup: new RabbitGroup({
        id: 1,
        region: new Region({ id: 1 }),
        rabbits: new Promise((resolve) => resolve([])),
      }),
    });

    const newRabbitGroup = new RabbitGroup({
      id: 2,
      region: new Region({ id: 1 }),
    });

    it('should be defined', () => {
      expect(service.updateRabbitGroup).toBeDefined();
    });

    it('should update rabbit group and remove old one', async () => {
      jest
        .spyOn(rabbitRepository, 'findOneBy')
        .mockResolvedValue({ ...rabbit });
      jest
        .spyOn(rabbitGroupsService, 'findOne')
        .mockResolvedValue(newRabbitGroup);

      const updatedRabbit = { ...rabbit };
      updatedRabbit.rabbitGroup = newRabbitGroup;

      await expect(
        service.updateRabbitGroup(rabbit.id, newRabbitGroup.id),
      ).resolves.toEqual(updatedRabbit);

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: undefined,
          },
        },
      });
      expect(rabbitGroupsService.findOne).toHaveBeenCalledWith(2, undefined);
      expect(rabbitRepository.save).toHaveBeenCalledWith(updatedRabbit);
      expect(rabbitGroupsService.remove).toHaveBeenCalledWith(
        rabbit.rabbitGroup.id,
      );
    });

    it('should update rabbit group without removing old one', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue({
        ...rabbit,
        rabbitGroup: {
          ...rabbit.rabbitGroup,
          rabbits: new Promise((resolve) => resolve([new Rabbit({ id: 2 })])),
        },
      });
      jest
        .spyOn(rabbitGroupsService, 'findOne')
        .mockResolvedValue(newRabbitGroup);

      const updatedRabbit = { ...rabbit };
      updatedRabbit.rabbitGroup = newRabbitGroup;

      await expect(
        service.updateRabbitGroup(rabbit.id, newRabbitGroup.id),
      ).resolves.toEqual(updatedRabbit);

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: undefined,
          },
        },
      });
      expect(rabbitGroupsService.findOne).toHaveBeenCalledWith(2, undefined);
      expect(rabbitRepository.save).toHaveBeenCalledWith(updatedRabbit);
      expect(rabbitGroupsService.remove).not.toHaveBeenCalled();
    });

    it('should create new rabbit group', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue({
        ...rabbit,
      });
      jest
        .spyOn(rabbitGroupsService, 'create')
        .mockResolvedValue(newRabbitGroup);

      const updatedRabbit = { ...rabbit };
      updatedRabbit.rabbitGroup = newRabbitGroup;

      await expect(service.updateRabbitGroup(rabbit.id)).resolves.toEqual(
        updatedRabbit,
      );

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: undefined,
          },
        },
      });
      expect(rabbitGroupsService.create).toHaveBeenCalledWith(1);
      expect(rabbitRepository.save).toHaveBeenCalledWith(updatedRabbit);
      expect(rabbitGroupsService.remove).toHaveBeenCalledWith(
        rabbit.rabbitGroup.id,
      );
    });

    it('should throw NotFoundException if rabbit not found', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.updateRabbitGroup(rabbit.id, newRabbitGroup.id),
      ).rejects.toThrow(new NotFoundException('Rabbit not found'));
    });

    it('should throw NotFoundException if rabbit group not found', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue({
        ...rabbit,
      });
      jest.spyOn(rabbitGroupsService, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateRabbitGroup(rabbit.id, newRabbitGroup.id),
      ).rejects.toThrow(new NotFoundException('Rabbit Group not found'));
    });

    it('should throw BadRequestException if user wants to create new rabbit group but current group has only one rabbit', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue({
        ...rabbit,
        rabbitGroup: {
          ...rabbit.rabbitGroup,
          rabbits: new Promise((resolve) => resolve([new Rabbit({ id: 2 })])),
        },
      });

      await expect(service.updateRabbitGroup(rabbit.id)).rejects.toThrow(
        new NotFoundException(
          'Cannot create a new rabbit group if the current rabbit group has only one rabbit',
        ),
      );
    });

    it('should send rabbit assigned notification', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue({
        ...rabbit,
        rabbitGroup: {
          ...rabbit.rabbitGroup,
          rabbits: new Promise((resolve) => resolve([new Rabbit({ id: 2 })])),
        },
      });
      jest
        .spyOn(rabbitGroupsService, 'findOne')
        .mockResolvedValue({ ...newRabbitGroup, team: new Team({ id: 1 }) });

      await expect(
        service.updateRabbitGroup(rabbit.id, newRabbitGroup.id),
      ).resolves.not.toThrow();

      expect(notificationsService.sendNotification).toHaveBeenCalledWith(
        new NotificationRabbitAssigned(1, rabbit.id),
      );
    });

    it('should send rabbit moved notification', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue({
        ...rabbit,
        rabbitGroup: {
          ...rabbit.rabbitGroup,
          team: new Team({ id: 1 }),
          rabbits: new Promise((resolve) => resolve([new Rabbit({ id: 2 })])),
        },
      });
      jest
        .spyOn(rabbitGroupsService, 'findOne')
        .mockResolvedValue({ ...newRabbitGroup, team: new Team({ id: 1 }) });

      await expect(
        service.updateRabbitGroup(rabbit.id, newRabbitGroup.id),
      ).resolves.not.toThrow();

      expect(notificationsService.sendNotification).toHaveBeenCalledWith(
        new NotificationRabitMoved(1, rabbit.id),
      );
    });

    it('should not send notification if rabbit group has no team', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue({
        ...rabbit,
        rabbitGroup: {
          ...rabbit.rabbitGroup,
          team: null,
          rabbits: new Promise((resolve) => resolve([new Rabbit({ id: 2 })])),
        },
      });
      jest
        .spyOn(rabbitGroupsService, 'findOne')
        .mockResolvedValue(newRabbitGroup);

      await expect(
        service.updateRabbitGroup(rabbit.id, newRabbitGroup.id),
      ).resolves.not.toThrow();

      expect(notificationsService.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('updateRabbitNoteFields', () => {
    it('should be defined', () => {
      expect(service.updateRabbitNoteFields).toBeDefined();
    });

    it('should update rabbit note fields', async () => {
      const updatedRabbit = { ...rabbits[0], weight: 1 };

      await service.updateRabbitNoteFields(rabbits[0].id, { weight: 1 });

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
      });
      expect(rabbitRepository.save).toHaveBeenCalledWith(updatedRabbit);
    });

    it('should throw NotFoundException if rabbit not found', async () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.updateRabbitNoteFields(rabbits[0].id, { weight: 1 }),
      ).rejects.toThrow(new NotFoundException('Rabbit not found'));
    });
  });

  describe('checkAdmissionState', () => {
    let date: Date;

    beforeEach(() => {
      date = new Date(2024, 4, 1);

      jest.useFakeTimers();
      jest.setSystemTime(date);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should be defined', () => {
      expect(service.checkAdmissionState).toBeDefined();
    });

    it('should notifiy not changed status', async () => {
      const rabbit = new Rabbit({
        id: 1,
        status: RabbitStatus.Incoming,
        admissionDate: new Date(2024, 1, 1),
        rabbitGroup: new RabbitGroup({
          id: 1,
          team: new Team({ id: 1 }),
          region: new Region({ id: 1 }),
        }),
      });

      jest.spyOn(rabbitRepository, 'find').mockResolvedValue([rabbit]);

      await service.checkAdmissionState();

      expect(notificationsService.sendNotification).toHaveBeenNthCalledWith(
        1,
        new NotificationAdmissionToConfirm(
          rabbit.admissionDate,
          rabbit.rabbitGroup.region.id,
          rabbit.id,
          false,
          rabbit.name,
          rabbit.rabbitGroup.team.id,
        ),
      );
      expect(notificationsService.sendNotification).toHaveBeenNthCalledWith(
        2,
        new NotificationAdmissionToConfirm(
          rabbit.admissionDate,
          rabbit.rabbitGroup.region.id,
          rabbit.id,
          true,
          rabbit.name,
          rabbit.rabbitGroup.team.id,
        ),
      );
    });
  });
});
