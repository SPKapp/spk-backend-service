import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import {
  paginatedFields,
  paginatedFieldsWithTotalCount,
  userAdmin,
  userRegionManager,
  userRegionManager2Regions,
} from '../../common/tests';
import { FirebaseAuthGuard } from '../../common/modules/auth';

import { PaginatedUsersResolver } from './paginated-users.resolver';
import { UsersService } from './users.service';

describe('PaginatedUsersResolver', () => {
  let resolver: PaginatedUsersResolver;
  let usersService: UsersService;

  const paginatedUsers = {
    data: [],
    offset: 0,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedUsersResolver,
        {
          provide: UsersService,
          useValue: {
            findAllPaginated: jest.fn(() => paginatedUsers),
          },
        },
      ],
    })

      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<PaginatedUsersResolver>(PaginatedUsersResolver);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(resolver.findAll).toBeDefined();
    });

    it('should return all users if the user is an Admin', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userAdmin, paginatedFields, args),
      ).resolves.toEqual(paginatedUsers);

      expect(usersService.findAllPaginated).toHaveBeenCalledWith(args, false);
    });

    it('should return all users if the user is an Admin and regionsIds are provided', async () => {
      const args = { offset: 0, limit: 10, regionsIds: [1] };

      await expect(
        resolver.findAll(userAdmin, paginatedFields, args),
      ).resolves.toEqual(paginatedUsers);

      expect(usersService.findAllPaginated).toHaveBeenCalledWith(args, false);
    });

    it('should return all users if the user is a Region Manager', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userRegionManager2Regions, paginatedFields, args),
      ).resolves.toEqual(paginatedUsers);

      expect(usersService.findAllPaginated).toHaveBeenCalledWith(
        { ...args, regionsIds: userRegionManager2Regions.managerRegions },
        false,
      );
    });

    it('should return all users if the user is a Region Manager and regionsIds are provided', async () => {
      const args = { offset: 0, limit: 10, regionsIds: [1] };

      await expect(
        resolver.findAll(userRegionManager2Regions, paginatedFields, args),
      ).resolves.toEqual(paginatedUsers);

      expect(usersService.findAllPaginated).toHaveBeenCalledWith(args, false);
    });

    it('should throw a ForbiddenException if the user does not have access to at least one of the regions', async () => {
      const args = { offset: 0, limit: 10, regionsIds: [1] };

      await expect(
        resolver.findAll(userRegionManager, paginatedFields, args),
      ).rejects.toThrow(
        new ForbiddenException(
          'User does not have access to at least one of the regions.',
        ),
      );

      expect(usersService.findAllPaginated).not.toHaveBeenCalled();
    });

    it('should return data with totalCount if totalCount is requested', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userAdmin, paginatedFieldsWithTotalCount, args),
      ).resolves.toEqual(paginatedUsers);

      expect(usersService.findAllPaginated).toHaveBeenCalledWith(args, true);
    });
  });
});
