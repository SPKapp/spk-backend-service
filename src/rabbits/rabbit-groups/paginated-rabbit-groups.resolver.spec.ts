import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import {
  AuthService,
  FirebaseAuthGuard,
  Role,
  UserDetails,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { PaginatedRabbitGroupsResolver } from './paginated-rabbit-groups.resolver';
import { RabbitGroupsService } from './rabbit-groups.service';

describe('PaginatedRabbitGroupsResolver', () => {
  let resolver: PaginatedRabbitGroupsResolver;
  let rabbitGroupsService: RabbitGroupsService;

  const userDetailsTeplate: UserDetails = {
    uid: '123',
    email: 'email1@example.com',
    phone: '123456789',
    roles: [],
    regions: [],
  };

  const paginatedRabbitGroups = {
    data: [],
    offset: 0,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedRabbitGroupsResolver,
        AuthService,
        {
          provide: RabbitGroupsService,
          useValue: {
            findAllPaginated: jest.fn(() => paginatedRabbitGroups),
            count: jest.fn(() => 10),
          },
        },
      ],
    })
      .overridePipe(getCurrentUserPipe)
      .useValue({ transform: jest.fn((currentUser) => currentUser) })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<PaginatedRabbitGroupsResolver>(
      PaginatedRabbitGroupsResolver,
    );
    rabbitGroupsService = module.get<RabbitGroupsService>(RabbitGroupsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(resolver.findAll).toBeDefined();
    });

    it('should throw bad permissions error', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [2],
      };

      await expect(
        resolver.findAll(userDetails, {
          regionsIds: [1],
          offset: 0,
          limit: 10,
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'Region ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should return paginated rabbit groups from Region manager', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [2],
      };

      await expect(
        resolver.findAll(userDetails, { offset: 0, limit: 10 }),
      ).resolves.toEqual({
        ...paginatedRabbitGroups,
        transferToFieds: {
          regionsIds: userDetails.regions,
        },
      });

      expect(rabbitGroupsService.findAllPaginated).toHaveBeenCalledWith(
        0,
        10,
        userDetails.regions,
      );
    });

    it('should return paginated rabbit groups', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      await expect(
        resolver.findAll(userDetails, { offset: 0, limit: 10 }),
      ).resolves.toEqual({
        ...paginatedRabbitGroups,
        transferToFieds: {
          regionsIds: undefined,
        },
      });

      expect(rabbitGroupsService.findAllPaginated).toHaveBeenCalledWith(
        0,
        10,
        undefined,
      );
    });
  });

  describe('totalCount', () => {
    it('should be defined', () => {
      expect(resolver.totalCount).toBeDefined();
    });

    it('should return total count of rabbit groups', async () => {
      const regionsIds = [1, 2, 3];

      await expect(
        resolver.totalCount({
          ...paginatedRabbitGroups,
          transferToFieds: { regionsIds },
        }),
      ).resolves.toEqual(10);

      expect(rabbitGroupsService.count).toHaveBeenCalledWith(regionsIds);
    });
  });
});
