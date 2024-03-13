import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { AuthService } from '../../common/modules/auth/auth.service';
import { FirebaseAuthGuard } from '../../common/modules/auth/firebase-auth/firebase-auth.guard';
import { Role } from '../../common/modules/auth/roles.eum';
import { UserDetails } from '../../common/modules/auth/current-user/current-user';

import { Region } from '../../common/modules/regions/entities/region.entity';

import { RabbitsResolver } from './rabbits.resolver';
import { RabbitsService } from './rabbits.service';

import { Rabbit } from '../entities/rabbit.entity';
import { RabbitGroup } from '../entities/rabbit-group.entity';
import { AdmissionType } from '../entities/admissionType.enum';
import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';

describe('RabbitsResolver', () => {
  let resolver: RabbitsResolver;
  // let rabbitsService: RabbitsService;

  const userDetailsTeplate: UserDetails = {
    uid: '123',
    email: 'email1@example.com',
    phone: '123456789',
    roles: [],
    regions: [],
  };

  const rabbits = [
    new Rabbit({
      id: 1,
      name: 'Rabbit 1',
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
    // rabbitsService = module.get<RabbitsService>(RabbitsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createRabbit', () => {
    const newRabbit = {
      name: rabbits[0].name,
      color: rabbits[0].color,
      admissionType: rabbits[0].admissionType,
    };

    it('should be defined', () => {
      expect(resolver.createRabbit).toBeDefined();
    });

    it('should throw an error if the regionId or rabbitGroupId is missing', async () => {
      await expect(
        resolver.createRabbit(userDetailsTeplate, newRabbit),
      ).rejects.toThrow(
        new BadRequestException('RegionId or RabbitGroupId is required'),
      );
    });

    it('should throw bad permissions error - wrong regionId', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [2],
      };

      await expect(
        resolver.createRabbit(userDetails, { ...newRabbit, regionId: 1 }),
      ).rejects.toThrow(
        new BadRequestException(
          'Region ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should throw bad permissions error - wrong rabbitGroupId', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [2],
      };

      await expect(
        resolver.createRabbit(userDetails, { ...newRabbit, rabbitGroupId: 1 }),
      ).rejects.toThrow(
        new BadRequestException(
          'Region ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should create a new rabbit', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      await expect(
        resolver.createRabbit(userDetails, { ...newRabbit, regionId: 1 }),
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

    // TODO: Add tests
  });

  describe('removeRabbit', () => {
    it('should be defined', () => {
      expect(resolver.removeRabbit).toBeDefined();
    });

    // TODO: Add tests
  });
});
