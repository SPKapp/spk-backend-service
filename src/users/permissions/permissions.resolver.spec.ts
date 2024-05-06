import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
} from '../../common/tests/user-details.template';
import { FirebaseAuthGuard, Role } from '../../common/modules/auth';

import { PermissionsResolver } from './permissions.resolver';
import { PermissionsService } from './permissions.service';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';

import { User } from '../entities';
import { Region } from '../../common/modules/regions/entities';

describe('PermissionsResolver', () => {
  let resolver: PermissionsResolver;
  let permissionsService: PermissionsService;
  let teamsService: TeamsService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsResolver,
        {
          provide: PermissionsService,
          useValue: {
            addRoleToUser: jest.fn(),
            removeRoleFromUser: jest.fn(),
          },
        },
        {
          provide: TeamsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<PermissionsResolver>(PermissionsResolver);
    permissionsService = module.get<PermissionsService>(PermissionsService);
    teamsService = module.get<TeamsService>(TeamsService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('addRoleToUser', () => {
    beforeEach(() => {
      usersService.findOne = jest
        .fn()
        .mockResolvedValue(new User({ id: 1, region: new Region({ id: 2 }) }));
    });

    it('should be defined', () => {
      expect(resolver.addRoleToUser).toBeDefined();
    });

    it('should add role to user', async () => {
      const userIdArg = '1';
      const role = Role.Volunteer;
      const regionIdArg = '1';
      const teamIdArg = '1';

      await expect(
        resolver.addRoleToUser(
          userAdmin,
          userIdArg,
          role,
          regionIdArg,
          teamIdArg,
        ),
      ).resolves.toBe(Role.Volunteer);

      expect(permissionsService.addRoleToUser).toHaveBeenCalledWith(
        Number(userIdArg),
        role,
        Number(regionIdArg),
        Number(teamIdArg),
      );
    });

    it('should throw error if user is not admin', async () => {
      const userIdArg = '1';
      const role = Role.Admin;

      await expect(
        resolver.addRoleToUser(userRegionManager, userIdArg, role),
      ).rejects.toThrow(
        new ForbiddenException('Only Admin can add Admin role to a user.'),
      );
    });

    it('should throw error if user not found', async () => {
      const userIdArg = '1';
      const role = Role.Volunteer;

      usersService.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        resolver.addRoleToUser(userRegionManager, userIdArg, role),
      ).rejects.toThrow(new BadRequestException('User not found.'));
    });

    it('should throw error if user does not have permissions', async () => {
      const userIdArg = '1';
      const role = Role.Volunteer;

      usersService.findOne = jest
        .fn()
        .mockResolvedValue(new User({ id: 1, region: new Region({ id: 1 }) }));

      await expect(
        resolver.addRoleToUser(userRegionManager, userIdArg, role),
      ).rejects.toThrow(
        new ForbiddenException(
          "User doesn't have permissions to add the role in userId region.",
        ),
      );
    });

    it('should throw error if region ID is required for RegionManager and RegionObserver roles', async () => {
      const userIdArg = '1';
      const role = Role.RegionManager;

      await expect(
        resolver.addRoleToUser(userRegionManager, userIdArg, role),
      ).rejects.toThrow(
        new BadRequestException(
          'Region ID is required for RegionManager and RegionObserver roles.',
        ),
      );
    });

    it('should throw error if user does not have permissions to add the role in this region', async () => {
      const userIdArg = '1';
      const role = Role.RegionManager;
      const regionIdArg = '1';

      await expect(
        resolver.addRoleToUser(userRegionManager, userIdArg, role, regionIdArg),
      ).rejects.toThrow(
        new ForbiddenException(
          "User doesn't have permissions to add the role in this region.",
        ),
      );
    });

    it('should throw error if user does not have permissions to add the role in this team', async () => {
      const userIdArg = '1';
      const role = Role.Volunteer;
      const teamIdArg = '1';

      jest.spyOn(teamsService, 'findOne').mockResolvedValue(null);

      await expect(
        resolver.addRoleToUser(
          userRegionManager,
          userIdArg,
          role,
          undefined,
          teamIdArg,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          "User doesn't have permissions to add the role in this team.",
        ),
      );
    });

    it('should throw error if user does not have permissions to add the role in this region', async () => {
      const userIdArg = '1';
      const role = Role.Volunteer;
      const regionIdArg = '1';

      await expect(
        resolver.addRoleToUser(userRegionManager, userIdArg, role, regionIdArg),
      ).rejects.toThrow(
        new ForbiddenException(
          "User doesn't have permissions to add the role in this region.",
        ),
      );
    });
  });

  describe('removeRoleFromUser', () => {
    it('should be defined', () => {
      expect(resolver.removeRoleFromUser).toBeDefined();
    });

    it('should remove role from user', async () => {
      const userIdArg = '1';
      const role = Role.Volunteer;

      await expect(
        resolver.removeRoleFromUser(userAdmin, userIdArg, role),
      ).resolves.toBe(Role.Volunteer);

      expect(permissionsService.removeRoleFromUser).toHaveBeenCalledWith(
        Number(userIdArg),
        role,
        undefined,
      );
    });

    it('should throw error if user is not admin', async () => {
      const userIdArg = '1';
      const role = Role.Admin;

      await expect(
        resolver.removeRoleFromUser(userRegionManager, userIdArg, role),
      ).rejects.toThrow(
        new ForbiddenException('Only Admin can remove Admin role from a user.'),
      );
    });

    it('should throw error if user not found', async () => {
      const userIdArg = '1';
      const role = Role.Volunteer;

      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);

      await expect(
        resolver.removeRoleFromUser(userRegionManager, userIdArg, role),
      ).rejects.toThrow(new BadRequestException('User not found.'));
    });

    it('should throw error if user does not have permissions', async () => {
      const userIdArg = '1';
      const role = Role.RegionManager;
      const regionIdArg = '1';

      await expect(
        resolver.removeRoleFromUser(
          userRegionManager,
          userIdArg,
          role,
          regionIdArg,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          "User doesn't have permissions to remove the role from this region.",
        ),
      );
    });

    it('should throw error if region ID is required for RegionManager and RegionObserver roles', async () => {
      const userIdArg = '1';
      const role = Role.RegionManager;

      await expect(
        resolver.removeRoleFromUser(userRegionManager, userIdArg, role),
      ).rejects.toThrow(
        new BadRequestException(
          'Region ID is required for RegionManager and RegionObserver roles.',
        ),
      );
    });
  });
});
