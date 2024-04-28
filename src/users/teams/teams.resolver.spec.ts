import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
} from '../../common/tests/user-details.template';
import {
  AuthService,
  FirebaseAuthGuard,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { TeamsResolver } from './teams.resolver';
import { TeamsService } from './teams.service';

import { Team } from '../entities/team.entity';
import { Region } from '../../common/modules/regions/entities/region.entity';

describe('TeamsResolver', () => {
  let resolver: TeamsResolver;
  let teamsService: TeamsService;

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
      jest.spyOn(teamsService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userAdmin, 1)).rejects.toThrow(
        new NotFoundException(`Team with ID 1 not found`),
      );
    });

    it('should throw an permission error', async () => {
      await expect(resolver.findOne(userRegionManager, 1)).rejects.toThrow(
        new ForbiddenException(
          'Team does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should return a team', async () => {
      await expect(resolver.findOne(userAdmin, 1)).resolves.toEqual(team);
    });
  });
});
