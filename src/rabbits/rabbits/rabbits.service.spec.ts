import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';

import { RabbitsService } from './rabbits.service';
import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';
import { Rabbit, RabbitGroup, AdmissionType } from '../entities';
import { Region } from '../../common/modules/regions/entities';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => jest.fn(),
}));

describe('RabbitsService', () => {
  let service: RabbitsService;
  let rabbitGroupsService: RabbitGroupsService;
  let rabbitRepository: any;

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
          provide: 'RabbitRepository',
          useValue: {
            save: jest.fn(() => rabbits[0]),
            findOneBy: jest.fn(() => rabbits[0]),
            softRemove: jest.fn(() => ({ id: 1 })),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitsService>(RabbitsService);
    rabbitGroupsService = module.get<RabbitGroupsService>(RabbitGroupsService);
    rabbitRepository = module.get('RabbitRepository');
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
    });

    it('should return null', () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(null);
      expect(service.findOne(1, undefined, [1])).resolves.toBeNull();

      expect(rabbitRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        rabbitGroup: {
          region: {
            id: undefined,
          },
          team: {
            id: In([1]),
          },
        },
      });
    });

    it('should return a rabbit by id with regionId and teamId filter', () => {
      expect(service.findOne(1, [1], [1])).resolves.toEqual(rabbits[0]);

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
});
