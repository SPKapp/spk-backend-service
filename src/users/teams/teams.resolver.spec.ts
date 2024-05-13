import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
} from '../../common/tests/user-details.template';
import { FirebaseAuthGuard } from '../../common/modules/auth';

import { TeamsResolver } from './teams.resolver';
import { TeamsService } from './teams.service';

import { Team } from '../entities';
import { Region } from '../../common/modules/regions/entities';

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

      await expect(resolver.findOne(userAdmin, '1')).rejects.toThrow(
        new NotFoundException(`Team with the provided id not found.`),
      );
      expect(teamsService.findOne).toHaveBeenCalledWith(1, undefined);
    });

    it('should throw an permission error', async () => {
      jest.spyOn(teamsService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userRegionManager, '1')).rejects.toThrow(
        new NotFoundException(`Team with the provided id not found.`),
      );

      expect(teamsService.findOne).toHaveBeenCalledWith(
        1,
        userRegionManager.managerRegions,
      );
    });

    it('should return a team', async () => {
      await expect(resolver.findOne(userAdmin, '1')).resolves.toEqual(team);
      expect(teamsService.findOne).toHaveBeenCalledWith(1, undefined);
    });
  });
});
