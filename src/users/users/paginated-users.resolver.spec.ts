import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
} from '../../common/tests/user-details.template';
import {
  AuthService,
  FirebaseAuthGuard,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { PaginatedUsersResolver } from './paginated-users.resolver';
import { UsersService } from './users.service';

import { User } from '../entities/user.entity';

describe('PaginatedUsersResolver', () => {
  let resolver: PaginatedUsersResolver;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedUsersResolver,
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            count: jest.fn(),
          },
        },
        AuthService,
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

    it('should throw bad permissions error', async () => {
      await expect(
        resolver.findAll(userRegionManager, {
          offset: 0,
          limit: 10,
          regionId: 1,
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'Region ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should find all users from Region', async () => {
      const users = [new User({ id: 1 })];
      jest.spyOn(usersService, 'findAll').mockResolvedValue(users);

      await expect(
        resolver.findAll(userAdmin, { offset: 0, limit: 10, regionId: 1 }),
      ).resolves.toEqual({
        data: users,
        offset: 0,
        limit: 10,
        transferToFieds: { regionsIds: [1] },
      });
      expect(usersService.findAll).toHaveBeenCalledWith([1], 0, 10);
    });

    it('should find all users', async () => {
      const users = [new User({ id: 1 })];
      jest.spyOn(usersService, 'findAll').mockResolvedValue(users);

      await expect(
        resolver.findAll(userAdmin, { offset: 0, limit: 10 }),
      ).resolves.toEqual({
        data: users,
        offset: 0,
        limit: 10,
        transferToFieds: { regionsIds: undefined },
      });
      expect(usersService.findAll).toHaveBeenCalledWith(undefined, 0, 10);
    });
  });

  describe('totalCount', () => {
    it('should be defined', () => {
      expect(resolver.totalCount).toBeDefined();
    });

    it('should return total count', async () => {
      const paginatedUsers = {
        data: [new User({ id: 1 })],
        offset: 0,
        limit: 10,
        transferToFieds: { regionsIds: [1] },
      };

      jest
        .spyOn(usersService, 'count')
        .mockResolvedValue(paginatedUsers.data.length);

      await expect(resolver.totalCount(paginatedUsers)).resolves.toEqual(1);
      expect(usersService.count).toHaveBeenCalledWith(
        paginatedUsers.transferToFieds.regionsIds,
      );
    });
  });
});
