import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
  userVolunteer,
} from '../../common/tests/user-details.template';
import {
  AuthService,
  FirebaseAuthGuard,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { Region } from '../../common/modules/regions/entities/region.entity';

import { RabbitsResolver } from './rabbits.resolver';
import { RabbitsService } from './rabbits.service';

import { Rabbit } from '../entities/rabbit.entity';
import { RabbitGroup } from '../entities/rabbit-group.entity';
import { AdmissionType } from '../entities/admissionType.enum';
import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';
import { Gender } from '../entities/gender.enum';

describe('RabbitsResolver', () => {
  let resolver: RabbitsResolver;
  let rabbitsService: RabbitsService;

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
        AuthService,
        {
          provide: RabbitsService,
          useValue: {
            create: jest.fn(() => rabbits[0]),
            update: jest.fn(() => rabbits[0]),
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
      .overridePipe(getCurrentUserPipe)
      .useValue({ transform: jest.fn((currentUser) => currentUser) })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<RabbitsResolver>(RabbitsResolver);
    rabbitsService = module.get<RabbitsService>(RabbitsService);
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
        new BadRequestException(
          'Region ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should throw bad permissions error - wrong rabbitGroupId', async () => {
      await expect(
        resolver.createRabbit(userRegionManager, {
          ...newRabbit,
          rabbitGroupId: 1,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Region ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should create a new rabbit', async () => {
      await expect(
        resolver.createRabbit(userAdmin, { ...newRabbit, regionId: 1 }),
      ).resolves.toEqual(rabbits[0]);
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(resolver.findAll).toBeDefined();
    });

    // TODO: Add tests
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    // TODO: Add tests
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

    // TODO: Add tests
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
