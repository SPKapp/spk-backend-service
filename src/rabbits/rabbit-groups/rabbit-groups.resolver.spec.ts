import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  AuthService,
  FirebaseAuthGuard,
  Role,
  UserDetails,
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

  const userDetailsTeplate: UserDetails = {
    uid: '123',
    email: 'email1@example.com',
    phone: '123456789',
    roles: [],
    regions: [],
  };

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
      const user = { ...userDetailsTeplate, roles: [Role.Admin] };

      await expect(resolver.findOne(user, rabbitGroup.id)).resolves.toEqual(
        rabbitGroup,
      );
    });

    it('should throw a NotFoundException if the rabbit group does not exist', async () => {
      const user = { ...userDetailsTeplate, roles: [Role.Admin] };

      jest.spyOn(rabbitGroupsService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(user, rabbitGroup.id)).rejects.toThrow(
        new NotFoundException(
          `Rabbit Group with ID ${rabbitGroup.id} not found`,
        ),
      );
    });

    it('should throw a ForbiddenException when the region manager does not have permissions', async () => {
      const user = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [2],
      };

      await expect(resolver.findOne(user, rabbitGroup.id)).rejects.toThrow(
        new ForbiddenException(
          'Rabbit Group does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should return a rabbit group from the region manager', async () => {
      const user = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [1],
      };

      await expect(resolver.findOne(user, rabbitGroup.id)).resolves.toEqual(
        rabbitGroup,
      );
    });

    it('should throw a ForbiddenException when the volunteer does not have permissions', async () => {
      const user = {
        ...userDetailsTeplate,
        roles: [Role.Volunteer],
        teamId: 2,
      };

      await expect(resolver.findOne(user, rabbitGroup.id)).rejects.toThrow(
        new ForbiddenException(
          'Rabbit Group does not belong to the Volunteer permissions.',
        ),
      );
    });

    it('should return a rabbit group from the volunteer', async () => {
      const user = {
        ...userDetailsTeplate,
        roles: [Role.Volunteer],
        teamId: 1,
      };

      await expect(resolver.findOne(user, rabbitGroup.id)).resolves.toEqual(
        rabbitGroup,
      );
    });
  });

  describe('updateTeam', () => {
    it('should be defined', () => {
      expect(resolver.updateTeam).toBeDefined();
    });

    it('should return a rabbit group as Admin', async () => {
      const user = { ...userDetailsTeplate, roles: [Role.Admin] };
      const team = new Team({ id: 1 });

      await expect(
        resolver.updateTeam(user, rabbitGroup.id, team.id),
      ).resolves.toEqual(rabbitGroup);

      expect(rabbitGroupsService.updateTeam).toHaveBeenCalledWith(
        rabbitGroup.id,
        team.id,
        undefined,
      );
    });

    it('should return a rabbit group as Region Manager', async () => {
      const user = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [1],
      };
      const team = new Team({ id: 1 });

      await expect(
        resolver.updateTeam(user, rabbitGroup.id, team.id),
      ).resolves.toEqual(rabbitGroup);

      expect(rabbitGroupsService.updateTeam).toHaveBeenCalledWith(
        rabbitGroup.id,
        team.id,
        [1],
      );
    });
  });
});
