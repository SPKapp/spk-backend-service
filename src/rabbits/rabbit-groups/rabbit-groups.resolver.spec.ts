import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
  userRegionManager2Regions,
  userVolunteer,
  userVolunteer2,
} from '../../common/tests/user-details.template';
import {
  AuthService,
  FirebaseAuthGuard,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { Region } from '../../common/modules/regions/entities/region.entity';
import { Team } from '../../users/entities/team.entity';

import { RabbitGroupsResolver } from './rabbit-groups.resolver';
import { RabbitGroupsService } from './rabbit-groups.service';

import { RabbitGroup } from '../entities/rabbit-group.entity';

describe('RabbitGroupsResolver', () => {
  let resolver: RabbitGroupsResolver;
  let rabbitGroupsService: RabbitGroupsService;

  const rabbitGroup = new RabbitGroup({
    id: 1,
    region: new Region({ id: 1 }),
    team: new Team({ id: 1 }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitGroupsResolver,
        AuthService,
        {
          provide: RabbitGroupsService,
          useValue: {
            findOne: jest.fn(() => rabbitGroup),
            updateTeam: jest.fn(() => rabbitGroup),
          },
        },
      ],
    })
      .overridePipe(getCurrentUserPipe)
      .useValue({ transform: jest.fn((currentUser) => currentUser) })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<RabbitGroupsResolver>(RabbitGroupsResolver);
    rabbitGroupsService = module.get<RabbitGroupsService>(RabbitGroupsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    it('should return a rabbit group', async () => {
      await expect(
        resolver.findOne(userAdmin, rabbitGroup.id),
      ).resolves.toEqual(rabbitGroup);
    });

    it('should throw a NotFoundException if the rabbit group does not exist', async () => {
      jest.spyOn(rabbitGroupsService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userAdmin, rabbitGroup.id)).rejects.toThrow(
        new NotFoundException(
          `Rabbit Group with ID ${rabbitGroup.id} not found`,
        ),
      );
    });

    it('should throw a ForbiddenException when the region manager does not have permissions', async () => {
      await expect(
        resolver.findOne(userRegionManager, rabbitGroup.id),
      ).rejects.toThrow(
        new ForbiddenException(
          'Rabbit Group does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should return a rabbit group from the region manager', async () => {
      await expect(
        resolver.findOne(userRegionManager2Regions, rabbitGroup.id),
      ).resolves.toEqual(rabbitGroup);
    });

    it('should throw a ForbiddenException when the volunteer does not have permissions', async () => {
      await expect(
        resolver.findOne(userVolunteer2, rabbitGroup.id),
      ).rejects.toThrow(
        new ForbiddenException(
          'Rabbit Group does not belong to the Volunteer permissions.',
        ),
      );
    });

    it('should return a rabbit group from the volunteer', async () => {
      await expect(
        resolver.findOne(userVolunteer, rabbitGroup.id),
      ).resolves.toEqual(rabbitGroup);
    });
  });

  describe('updateTeam', () => {
    it('should be defined', () => {
      expect(resolver.updateTeam).toBeDefined();
    });

    it('should return a rabbit group as Admin', async () => {
      const team = new Team({ id: 1 });

      await expect(
        resolver.updateTeam(userAdmin, rabbitGroup.id, team.id),
      ).resolves.toEqual(rabbitGroup);

      expect(rabbitGroupsService.updateTeam).toHaveBeenCalledWith(
        rabbitGroup.id,
        team.id,
        undefined,
      );
    });

    it('should return a rabbit group as Region Manager', async () => {
      const team = new Team({ id: 1 });

      await expect(
        resolver.updateTeam(userRegionManager2Regions, rabbitGroup.id, team.id),
      ).resolves.toEqual(rabbitGroup);

      expect(rabbitGroupsService.updateTeam).toHaveBeenCalledWith(
        rabbitGroup.id,
        team.id,
        [1, 3],
      );
    });
  });
});
