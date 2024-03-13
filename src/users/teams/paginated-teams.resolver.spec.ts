import { Test, TestingModule } from '@nestjs/testing';

import {
  FirebaseAuthGuard,
  Role,
  UserDetails,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { PaginatedTeamsResolver } from './paginated-teams.resolver';
import { TeamsService } from './teams.service';
import { Team } from '../entities/team.entity';

describe('PaginatedTeamsResolver', () => {
  let resolver: PaginatedTeamsResolver;
  let teamsService: TeamsService;

  const teams = [new Team({ id: 1 }), new Team({ id: 2 })];

  const userDetailsTeplate: UserDetails = {
    uid: '123',
    email: 'email1@example.com',
    phone: '123456789',
    roles: [],
    regions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedTeamsResolver,
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
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      await expect(
        resolver.findAll(userDetails, { offset: 0, limit: 10 }),
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

    it('should return all teams from the user regions if the user is a Region Manager', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [1, 2],
      };

      await expect(
        resolver.findAll(userDetails, { offset: 0, limit: 10 }),
      ).resolves.toEqual({
        data: teams,
        offset: 0,
        limit: 10,
        transferToFieds: {
          regionsIds: [1, 2],
        },
      });

      expect(teamsService.findAll).toHaveBeenCalledWith([1, 2], 0, 10);
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
