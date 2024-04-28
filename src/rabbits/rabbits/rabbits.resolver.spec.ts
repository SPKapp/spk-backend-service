import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
  userRegionObserver,
  userVolunteer,
} from '../../common/tests/user-details.template';
import { FirebaseAuthGuard } from '../../common/modules/auth';

import { Rabbit, RabbitGroup, AdmissionType, Gender } from '../entities';
import { Region } from '../../common/modules/regions/entities';

import { RabbitsResolver } from './rabbits.resolver';
import { RabbitsService } from './rabbits.service';
import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';
import { RabbitsAccessService } from '../rabbits-access.service';

describe('RabbitsResolver', () => {
  let resolver: RabbitsResolver;
  let rabbitsService: RabbitsService;
  let rabbitsAccessService: RabbitsAccessService;

  const rabbits = [
    new Rabbit({
      id: 1,
      name: 'Rabbit 1',
      gender: Gender.Male,
      admissionType: AdmissionType.Found,
      color: 'White',

      rabbitGroup: new RabbitGroup({ id: 1, region: new Region({ id: 1 }) }),
    }),
    new Rabbit({
      id: 1,
      name: 'Rabbit 1',
      rabbitGroup: new RabbitGroup({ id: 2, region: new Region({ id: 2 }) }),
    }),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitsResolver,
        {
          provide: RabbitsAccessService,
          useValue: {
            validateAccessForRabbitGroup: jest.fn(() => true),
          },
        },
        {
          provide: RabbitsService,
          useValue: {
            create: jest.fn(() => rabbits[0]),
            findOne: jest.fn(() => rabbits[0]),
            update: jest.fn(() => rabbits[0]),
            remove: jest.fn(() => 1),
            updateRabbitGroup: jest.fn(() => rabbits[0]),
          },
        },
        {
          provide: RabbitGroupsService,
          useValue: {
            findOne: jest.fn(() => rabbits[0].rabbitGroup),
          },
        },
      ],
    })

      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<RabbitsResolver>(RabbitsResolver);
    rabbitsService = module.get<RabbitsService>(RabbitsService);
    rabbitsAccessService =
      module.get<RabbitsAccessService>(RabbitsAccessService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createRabbit', () => {
    const newRabbit = {
      name: rabbits[0].name,
      color: rabbits[0].color,
      gender: rabbits[0].gender,
      admissionType: rabbits[0].admissionType,
    };

    it('should be defined', () => {
      expect(resolver.createRabbit).toBeDefined();
    });

    it('should throw an error if the regionId or rabbitGroupId is missing', async () => {
      await expect(resolver.createRabbit(userAdmin, newRabbit)).rejects.toThrow(
        new BadRequestException('RegionId or RabbitGroupId is required'),
      );
    });

    it('should throw bad permissions error - wrong regionId', async () => {
      await expect(
        resolver.createRabbit(userRegionManager, { ...newRabbit, regionId: 1 }),
      ).rejects.toThrow(
        new ForbiddenException(
          'Region ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should throw bad permissions error - wrong rabbitGroupId', async () => {
      jest
        .spyOn(rabbitsAccessService, 'validateAccessForRabbitGroup')
        .mockResolvedValue(false);

      await expect(
        resolver.createRabbit(userRegionManager, {
          ...newRabbit,
          rabbitGroupId: 1,
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'Rabbit Group ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should create a new rabbit - Admin', async () => {
      await expect(
        resolver.createRabbit(userAdmin, { ...newRabbit, regionId: 1 }),
      ).resolves.toEqual(rabbits[0]);
    });

    it('should create a new rabbit - Region Manager', async () => {
      await expect(
        resolver.createRabbit(userRegionManager, {
          ...newRabbit,
          regionId: userRegionManager.managerRegions[0],
        }),
      ).resolves.toEqual(rabbits[0]);
    });

    it('should create a new rabbit in a rabbit group - Admin', async () => {
      await expect(
        resolver.createRabbit(userAdmin, {
          ...newRabbit,
          rabbitGroupId: 1,
        }),
      ).resolves.toEqual(rabbits[0]);
    });

    it('should create a new rabbit in a rabbit group - Region Manager', async () => {
      await expect(
        resolver.createRabbit(userRegionManager, {
          ...newRabbit,
          rabbitGroupId: 1,
        }),
      ).resolves.toEqual(rabbits[0]);
    });
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    it('should call the service with the correct parameters - Admin', async () => {
      await resolver.findOne(userAdmin, 1);

      expect(rabbitsService.findOne).toHaveBeenCalledWith(
        1,
        undefined,
        undefined,
      );
    });

    it('should call the service with the correct parameters - RegionManager', async () => {
      await resolver.findOne(userRegionManager, 1);

      expect(rabbitsService.findOne).toHaveBeenCalledWith(1, [2], undefined);
    });

    it('should call the service with the correct parameters - RegionObsercer', async () => {
      await resolver.findOne(userRegionObserver, 1);

      expect(rabbitsService.findOne).toHaveBeenCalledWith(1, [2], undefined);
    });

    it('should call the service with the correct parameters - Volunteer', async () => {
      await resolver.findOne(userVolunteer, 1);

      expect(rabbitsService.findOne).toHaveBeenCalledWith(1, undefined, [1]);
    });
  });

  describe('updateRabbit', () => {
    it('should be defined', () => {
      expect(resolver.updateRabbit).toBeDefined();
    });

    it('should call the service with the correct parameters - Admin', async () => {
      const updateData = {
        id: 1,
        name: 'Rabbit 1',
      };

      await resolver.updateRabbit(userAdmin, updateData);

      expect(rabbitsService.update).toHaveBeenCalledWith(
        updateData.id,
        updateData,
        true,
        undefined,
        undefined,
      );
    });

    it('should call the service with the correct parameters - RegionManager', async () => {
      const updateData = {
        id: 1,
        name: 'Rabbit 1',
      };

      await resolver.updateRabbit(userRegionManager, updateData);

      expect(rabbitsService.update).toHaveBeenCalledWith(
        updateData.id,
        updateData,
        true,
        [2],
        undefined,
      );
    });

    it('should call the service with the correct parameters - Volunteer', async () => {
      const updateData = {
        id: 1,
        color: 'White',
      };

      await resolver.updateRabbit(userVolunteer, updateData);

      expect(rabbitsService.update).toHaveBeenCalledWith(
        updateData.id,
        updateData,
        false,
        undefined,
        [1],
      );
    });
  });

  describe('removeRabbit', () => {
    it('should be defined', () => {
      expect(resolver.removeRabbit).toBeDefined();
    });

    it('should call the service with the correct parameters - Admin', async () => {
      await resolver.removeRabbit(userAdmin, 1);

      expect(rabbitsService.remove).toHaveBeenCalledWith(1, undefined);
    });

    it('should call the service with the correct parameters - RegionManager', async () => {
      await resolver.removeRabbit(userRegionManager, 1);

      expect(rabbitsService.remove).toHaveBeenCalledWith(
        1,
        userRegionManager.managerRegions,
      );
    });
  });

  describe('updateRabbitGroup', () => {
    it('should be defined', () => {
      expect(resolver.updateRabbitGroup).toBeDefined();
    });

    it('should call the service with the correct parameters - Admin', async () => {
      await resolver.updateRabbitGroup(userAdmin, 1, 2);

      expect(rabbitsService.updateRabbitGroup).toHaveBeenCalledWith(
        1,
        2,
        undefined,
      );
    });

    it('should call the service with the correct parameters - RegionManager', async () => {
      await resolver.updateRabbitGroup(userRegionManager, 1, 2);

      expect(rabbitsService.updateRabbitGroup).toHaveBeenCalledWith(1, 2, [2]);
    });
  });
});
