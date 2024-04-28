import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
  userRegionObserver,
  userVolunteer,
} from '../../common/tests/user-details.template';
import {
  paginatedFields,
  paginatedFieldsWithTotalCount,
} from '../../common/tests/paginated-fields.template';
import { FirebaseAuthGuard } from '../../common/modules/auth';

import { PaginatedRabbitGroupsResolver } from './paginated-rabbit-groups.resolver';
import { RabbitGroupsService } from './rabbit-groups.service';

describe('PaginatedRabbitGroupsResolver', () => {
  let resolver: PaginatedRabbitGroupsResolver;
  let rabbitGroupsService: RabbitGroupsService;

  const paginatedRabbitGroups = {
    data: [],
    offset: 0,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedRabbitGroupsResolver,
        {
          provide: RabbitGroupsService,
          useValue: {
            findAllPaginated: jest.fn(() => paginatedRabbitGroups),
          },
        },
      ],
    })

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

    it('should throw bad permissions error - Region Manager', async () => {
      const args = { offset: 0, limit: 10, regionsIds: [1] };

      await expect(
        resolver.findAll(userRegionManager, paginatedFields, args),
      ).rejects.toThrow(
        new ForbiddenException('Region ID does not match permissions.'),
      );
    });

    it('should throw bad permissions error - Region Observer', async () => {
      const args = { offset: 0, limit: 10, regionsIds: [1] };

      await expect(
        resolver.findAll(userRegionObserver, paginatedFields, args),
      ).rejects.toThrow(
        new ForbiddenException('Region ID does not match permissions.'),
      );
    });

    it('should return paginated rabbit groups from Region Manager', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userRegionManager, paginatedFields, args),
      ).resolves.toEqual(paginatedRabbitGroups);

      expect(rabbitGroupsService.findAllPaginated).toHaveBeenCalledWith(
        { ...args, regionsIds: userRegionManager.managerRegions },
        false,
      );
    });

    it('should return paginated rabbit groups from Region Observer', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userRegionObserver, paginatedFields, args),
      ).resolves.toEqual(paginatedRabbitGroups);

      expect(rabbitGroupsService.findAllPaginated).toHaveBeenCalledWith(
        { ...args, regionsIds: userRegionObserver.observerRegions },
        false,
      );
    });

    it('should return paginated rabbit groups from Volunteer', async () => {
      const args = { offset: 0, limit: 10, teamIds: [123] };

      await expect(
        resolver.findAll(userVolunteer, paginatedFields, args),
      ).resolves.toEqual(paginatedRabbitGroups);

      expect(rabbitGroupsService.findAllPaginated).toHaveBeenCalledWith(
        { ...args, teamIds: [userVolunteer.teamId] },
        false,
      );
    });

    it('should return paginated rabbit groups from Admin', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userAdmin, paginatedFields, args),
      ).resolves.toEqual(paginatedRabbitGroups);

      expect(rabbitGroupsService.findAllPaginated).toHaveBeenCalledWith(
        args,
        false,
      );
    });

    it('should return paginated rabbit groups with totalCount', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userAdmin, paginatedFieldsWithTotalCount, args),
      ).resolves.toEqual(paginatedRabbitGroups);

      expect(rabbitGroupsService.findAllPaginated).toHaveBeenCalledWith(
        args,
        true,
      );
    });
  });
});
