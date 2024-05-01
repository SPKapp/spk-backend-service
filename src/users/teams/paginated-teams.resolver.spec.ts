import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager2Regions,
} from '../../common/tests/user-details.template';
import {
  paginatedFields,
  paginatedFieldsWithTotalCount,
} from '../../common/tests/paginated-fields.template';
import { FirebaseAuthGuard } from '../../common/modules/auth';

import { PaginatedTeamsResolver } from './paginated-teams.resolver';
import { TeamsService } from './teams.service';

describe('PaginatedTeamsResolver', () => {
  let resolver: PaginatedTeamsResolver;
  let teamsService: TeamsService;

  const paginatedTeams = {
    data: [],
    offset: 0,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedTeamsResolver,
        {
          provide: TeamsService,
          useValue: {
            findAllPaginated: jest.fn(() => paginatedTeams),
          },
        },
      ],
    })

      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<PaginatedTeamsResolver>(PaginatedTeamsResolver);
    teamsService = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(resolver.findAll).toBeDefined();
    });

    it('should return all teams if the user is an Admin', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userAdmin, paginatedFields, args),
      ).resolves.toEqual(paginatedTeams);

      expect(teamsService.findAllPaginated).toHaveBeenCalledWith(args, false);
    });

    it('should return all teams if the user is an Admin and regionsIds are provided', async () => {
      const args = { offset: 0, limit: 10, regionsIds: [1] };

      await expect(
        resolver.findAll(userAdmin, paginatedFields, args),
      ).resolves.toEqual(paginatedTeams);

      expect(teamsService.findAllPaginated).toHaveBeenCalledWith(args, false);
    });

    it('should return all teams from the user regions if the user is a Region Manager', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userRegionManager2Regions, paginatedFields, args),
      ).resolves.toEqual(paginatedTeams);

      expect(teamsService.findAllPaginated).toHaveBeenCalledWith(
        { ...args, regionsIds: userRegionManager2Regions.managerRegions },
        false,
      );
    });

    it('should throw a BadRequestException if the user is a Region Manager and tries to access teams from other regions', async () => {
      const args = { offset: 0, limit: 10, regionsIds: [1, 2] };

      await expect(
        resolver.findAll(userRegionManager2Regions, paginatedFields, args),
      ).rejects.toThrow(
        new ForbiddenException(
          'User does not have access to at least one of the regions.',
        ),
      );
    });

    it('should return all teams from the user regions if the user is a Region Manager and regionsIds are provided', async () => {
      const args = { offset: 0, limit: 10, regionsIds: [1] };

      await expect(
        resolver.findAll(userRegionManager2Regions, paginatedFields, args),
      ).resolves.toEqual(paginatedTeams);

      expect(teamsService.findAllPaginated).toHaveBeenCalledWith(args, false);
    });

    it('should return data with totalCount if totalCount is requested', async () => {
      const args = { offset: 0, limit: 10 };

      await expect(
        resolver.findAll(userAdmin, paginatedFieldsWithTotalCount, args),
      ).resolves.toEqual(paginatedTeams);

      expect(teamsService.findAllPaginated).toHaveBeenCalledWith(args, true);
    });
  });
});
