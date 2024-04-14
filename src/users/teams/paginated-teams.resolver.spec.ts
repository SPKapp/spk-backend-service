import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager2Regions,
} from '../../common/tests/user-details.template';
import {
  AuthService,
  FirebaseAuthGuard,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { PaginatedTeamsResolver } from './paginated-teams.resolver';
import { TeamsService } from './teams.service';
import { Team } from '../entities/team.entity';

describe('PaginatedTeamsResolver', () => {
  let resolver: PaginatedTeamsResolver;
  let teamsService: TeamsService;

  const teams = [new Team({ id: 1 }), new Team({ id: 2 })];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedTeamsResolver,
        AuthService,
        {
          provide: TeamsService,
          useValue: {
            findAll: jest.fn(() => teams),
            count: jest.fn(() => teams.length),
          },
        },
      ],
    })
      .overridePipe(getCurrentUserPipe)
      .useValue({ transform: jest.fn((currentUser) => currentUser) })
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
      await expect(
        resolver.findAll(userAdmin, { offset: 0, limit: 10 }),
      ).resolves.toEqual({
        data: teams,
        offset: 0,
        limit: 10,
        transferToFieds: {
          regionsIds: undefined,
        },
      });

      expect(teamsService.findAll).toHaveBeenCalledWith(undefined, 0, 10);
    });

    it('should return all teams if the user is an Admin and regionsIds are provided', async () => {
      await expect(
        resolver.findAll(userAdmin, {
          offset: 0,
          limit: 10,
          regionsIds: [1],
        }),
      ).resolves.toEqual({
        data: teams,
        offset: 0,
        limit: 10,
        transferToFieds: {
          regionsIds: [1],
        },
      });

      expect(teamsService.findAll).toHaveBeenCalledWith([1], 0, 10);
    });

    it('should return all teams from the user regions if the user is a Region Manager', async () => {
      await expect(
        resolver.findAll(userRegionManager2Regions, { offset: 0, limit: 10 }),
      ).resolves.toEqual({
        data: teams,
        offset: 0,
        limit: 10,
        transferToFieds: {
          regionsIds: [1, 3],
        },
      });

      expect(teamsService.findAll).toHaveBeenCalledWith([1, 3], 0, 10);
    });

    it('should throw a BadRequestException if the user is a Region Manager and tries to access teams from other regions', async () => {
      await expect(
        resolver.findAll(userRegionManager2Regions, {
          offset: 0,
          limit: 10,
          regionsIds: [2],
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'Region ID does not match the Region Manager permissions.',
        ),
      );
    });

    it('should return all teams from the user regions if the user is a Region Manager and regionsIds are provided', async () => {
      await expect(
        resolver.findAll(userRegionManager2Regions, {
          offset: 0,
          limit: 10,
          regionsIds: [1],
        }),
      ).resolves.toEqual({
        data: teams,
        offset: 0,
        limit: 10,
        transferToFieds: {
          regionsIds: [1],
        },
      });

      expect(teamsService.findAll).toHaveBeenCalledWith([1], 0, 10);
    });
  });

  describe('totalCount', () => {
    it('should be defined', () => {
      expect(resolver.totalCount).toBeDefined();
    });

    it('should return the total count of teams', async () => {
      const paginatedTeams = {
        data: teams,
        offset: 0,
        limit: 10,
        transferToFieds: {
          regionsIds: [1, 2],
        },
      };

      await expect(resolver.totalCount(paginatedTeams)).resolves.toEqual(
        teams.length,
      );
      expect(teamsService.count).toHaveBeenCalledWith([1, 2]);
    });
  });
});
