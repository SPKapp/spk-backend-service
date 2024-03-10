import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { AuthService } from '../../common/modules/auth/auth.service';
import { FirebaseAuthGuard } from '../../common/modules/auth/firebase-auth/firebase-auth.guard';
import { Role } from '../../common/modules/auth/roles.eum';
import { UserDetails } from '../../common/modules/auth/current-user/current-user';

import { TeamsResolver } from './teams.resolver';
import { TeamsService } from './teams.service';

import { Team } from '../entities/team.entity';
import { Region } from '../../common/modules/regions/entities/region.entity';

describe('TeamsResolver', () => {
  let resolver: TeamsResolver;

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
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<TeamsResolver>(TeamsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
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
