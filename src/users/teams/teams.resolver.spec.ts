import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  AuthService,
  FirebaseAuthGuard,
  Role,
  UserDetails,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { TeamsResolver } from './teams.resolver';
import { TeamsService } from './teams.service';

import { Team } from '../entities/team.entity';
import { Region } from '../../common/modules/regions/entities/region.entity';

describe('TeamsResolver', () => {
  let resolver: TeamsResolver;
  let teamsService: TeamsService;

  const userDetailsTeplate: UserDetails = {
    uid: '123',
    email: 'email1@example.com',
    phone: '123456789',
    roles: [],
    regions: [],
  };
  const team = new Team({ id: 1, region: new Region({ id: 1 }) });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsResolver,
        {
          provide: TeamsService,
          useFactory: () => ({
            findOne: jest.fn(() => team),
          }),
        },
        AuthService,
      ],
    })
      .overridePipe(getCurrentUserPipe)
      .useValue({ transform: jest.fn((currentUser) => currentUser) })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<TeamsResolver>(TeamsResolver);
    teamsService = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    it('should throw an error if team does not exist', async () => {
      const currentUser = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      jest.spyOn(teamsService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(currentUser, 1)).rejects.toThrow(
        new NotFoundException(`Team with ID 1 not found`),
      );
    });

    it('should throw an permission error', async () => {
      const currentUser = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [2],
      };

      await expect(resolver.findOne(currentUser, 1)).rejects.toThrow(
        new ForbiddenException(
          'Team does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should return a team', async () => {
      const currentUser = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      await expect(resolver.findOne(currentUser, 1)).resolves.toEqual(team);
    });
  });
});
