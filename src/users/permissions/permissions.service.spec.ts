import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { PermissionsService } from './permissions.service';
import { TeamsService } from '../teams/teams.service';
import { FirebaseAuthService, Role } from '../../common/modules/auth';
import { RegionsService } from '../../common/modules/regions';
import { RoleEntity, Team, TeamHistory, User } from '../entities';
import { Region } from '../../common/modules/regions/entities';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => jest.fn(),
}));

describe('PermissionsService', () => {
  let service: PermissionsService;
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let roleRepository: Repository<RoleEntity>;
  let teamHistoryRepository: Repository<TeamHistory>;
  let firebaseAuthService: FirebaseAuthService;
  let regionsService: RegionsService;
  let teamsService: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: {
            save: jest.fn(),
            findBy: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Team),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TeamHistory),
          useValue: {
            update: jest.fn(),
            findBy: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: FirebaseAuthService,
          useValue: {
            addRoleToUser: jest.fn(),
            removeRoleFromUser: jest.fn(),
            deactivateUser: jest.fn(),
            activateUser: jest.fn(),
          },
        },
        {
          provide: RegionsService,
          useValue: {
            findOne: jest.fn(),
            addRoleToUser: jest.fn(),
          },
        },
        {
          provide: TeamsService,
          useValue: {
            create: jest.fn(),
            maybeDeactivate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    teamRepository = module.get<Repository<Team>>(getRepositoryToken(Team));
    roleRepository = module.get<Repository<RoleEntity>>(
      getRepositoryToken(RoleEntity),
    );
    teamHistoryRepository = module.get<Repository<TeamHistory>>(
      getRepositoryToken(TeamHistory),
    );
    firebaseAuthService = module.get<FirebaseAuthService>(FirebaseAuthService);
    regionsService = module.get<RegionsService>(RegionsService);
    teamsService = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addRoleToUser', () => {
    const activeUser = new User({
      id: 1,
      firebaseUid: 'firebaseUid',
      active: true,
      roles: Promise.resolve([]),
    });

    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(activeUser);
    });

    it('should be defined', () => {
      expect(service.addRoleToUser).toBeDefined();
    });

    it('should throw an error if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(undefined);

      await expect(service.addRoleToUser(1, Role.Admin)).rejects.toThrow(
        new NotFoundException('User with the provided id does not exist.'),
      );
    });

    it('should throw an error if user is not active', async () => {
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(new User({ active: false }));

      await expect(service.addRoleToUser(1, Role.Admin)).rejects.toThrow(
        new BadRequestException('User is not active.'),
      );
    });

    it('should add Admin role to user', async () => {
      await service.addRoleToUser(1, Role.Admin);

      expect(roleRepository.save).toHaveBeenCalledWith(
        new RoleEntity({ role: Role.Admin, user: activeUser }),
      );
      expect(firebaseAuthService.addRoleToUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.Admin,
        undefined,
      );
    });

    it('should ommit saving the role if it already exists', async () => {
      const user = new User({
        ...activeUser,
        roles: Promise.resolve([new RoleEntity({ role: Role.Admin })]),
      });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      await service.addRoleToUser(1, Role.Admin);

      expect(roleRepository.save).not.toHaveBeenCalled();
      expect(firebaseAuthService.addRoleToUser).toHaveBeenCalledWith(
        user.firebaseUid,
        Role.Admin,
        undefined,
      );
    });

    it('should throw an error if additional information is required for the role - RegionManager', async () => {
      await expect(
        service.addRoleToUser(1, Role.RegionManager),
      ).rejects.toThrow(
        new BadRequestException(
          'Additional information is required for this role.',
        ),
      );
    });

    it('should throw an error if additional information is required for the role - RegionObserver', async () => {
      await expect(
        service.addRoleToUser(1, Role.RegionObserver),
      ).rejects.toThrow(
        new BadRequestException(
          'Additional information is required for this role.',
        ),
      );
    });

    it('should throw an error if region does not exist', async () => {
      jest.spyOn(regionsService, 'findOne').mockResolvedValue(undefined);

      await expect(
        service.addRoleToUser(1, Role.RegionObserver, 1),
      ).rejects.toThrow(
        new BadRequestException('Region with the provided id does not exist.'),
      );
    });

    it('should add RegionManager role to user', async () => {
      jest.spyOn(regionsService, 'findOne').mockResolvedValue(new Region());

      await service.addRoleToUser(1, Role.RegionManager, 1);

      expect(roleRepository.save).toHaveBeenCalledWith(
        new RoleEntity({
          role: Role.RegionManager,
          additionalInfo: 1,
          user: activeUser,
        }),
      );
      expect(firebaseAuthService.addRoleToUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.RegionManager,
        1,
      );
    });

    it('should add RegionObserver role to user', async () => {
      jest.spyOn(regionsService, 'findOne').mockResolvedValue(new Region());

      await service.addRoleToUser(1, Role.RegionObserver, 1);

      expect(roleRepository.save).toHaveBeenCalledWith(
        new RoleEntity({
          role: Role.RegionObserver,
          additionalInfo: 1,
          user: activeUser,
        }),
      );
      expect(firebaseAuthService.addRoleToUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.RegionObserver,
        1,
      );
    });
  });

  describe('addRoleToUser - Volunteer', () => {
    const activeUser = new User({
      id: 1,
      firebaseUid: 'firebaseUid',
      active: true,
      region: new Region({ id: 1 }),
      roles: Promise.resolve([]),
    });

    const teamUser = new User({
      ...activeUser,
      team: new Team({
        id: 1,
        region: new Region({ id: 1 }),
      }),
    });

    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(activeUser);
    });

    it('should throw an error if additional information is required for the role - Volunteer', async () => {
      await expect(service.addRoleToUser(1, Role.Volunteer)).rejects.toThrow(
        new BadRequestException(
          'Additional information is required for this role.',
        ),
      );
    });

    it('should add Volunteer role to user - same region', async () => {
      const newTeam = new Team({ id: 2, region: new Region({ id: 2 }) });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ ...teamUser });
      jest.spyOn(teamsService, 'create').mockResolvedValue({ ...newTeam });
      jest.spyOn(userRepository, 'find').mockResolvedValue([]);
      jest.spyOn(teamHistoryRepository, 'findBy').mockResolvedValue([]);

      await service.addRoleToUser(1, Role.Volunteer);

      // addVolunteerRole
      expect(teamsService.create).toHaveBeenCalledWith(teamUser.team.region.id);

      // removeUserFromTeam
      const userWithoutTeam = {
        ...teamUser,
        team: undefined,
      };

      expect(teamsService.maybeDeactivate).toHaveBeenCalledWith(teamUser.team);

      expect(teamHistoryRepository.update).toHaveBeenCalledWith(
        {
          user: { id: userWithoutTeam.id },
          endDate: IsNull(),
        },
        {
          endDate: expect.any(Date),
        },
      );

      // addUserToTeam
      const userwithNewTeam = {
        ...userWithoutTeam,
        region: newTeam.region,
        team: newTeam,
      };

      expect(userRepository.save).toHaveBeenNthCalledWith(2, userwithNewTeam);
      expect(teamHistoryRepository.findBy).toHaveBeenCalledWith({
        user: { id: userwithNewTeam.id },
        team: { id: userwithNewTeam.team.id },
        endDate: IsNull(),
      });
      expect(teamHistoryRepository.save).toHaveBeenCalledWith(
        new TeamHistory({
          user: userwithNewTeam,
          team: userwithNewTeam.team,
          startDate: expect.any(Date),
        }),
      );

      expect(roleRepository.save).toHaveBeenCalledWith(
        new RoleEntity({
          role: Role.Volunteer,
          additionalInfo: userwithNewTeam.team.id,
          user: userwithNewTeam,
        }),
      );
      expect(firebaseAuthService.addRoleToUser).toHaveBeenCalledWith(
        userwithNewTeam.firebaseUid,
        Role.Volunteer,
        userwithNewTeam.team.id,
      );
    });

    it('should add Volunteer role to user - regionId', async () => {
      const newTeam = new Team({ id: 2, region: new Region({ id: 1 }) });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ ...teamUser });
      jest.spyOn(teamsService, 'create').mockResolvedValue({ ...newTeam });
      jest.spyOn(userRepository, 'find').mockResolvedValue([]);
      jest
        .spyOn(teamHistoryRepository, 'findBy')
        .mockResolvedValue([new TeamHistory({})]);

      await service.addRoleToUser(1, Role.Volunteer, 1);

      // addVolunteerRole
      expect(teamsService.create).toHaveBeenCalledWith(1);

      // removeUserFromTeam
      const userWithoutTeam = {
        ...teamUser,
        team: undefined,
      };

      expect(teamsService.maybeDeactivate).toHaveBeenCalledWith(teamUser.team);

      expect(teamHistoryRepository.update).toHaveBeenCalledWith(
        {
          user: { id: userWithoutTeam.id },
          endDate: IsNull(),
        },
        {
          endDate: expect.any(Date),
        },
      );

      // addUserToTeam
      const userwithNewTeam = {
        ...userWithoutTeam,
        team: newTeam,
      };

      expect(userRepository.save).toHaveBeenNthCalledWith(2, userwithNewTeam);
      expect(teamHistoryRepository.findBy).toHaveBeenCalledWith({
        user: { id: userwithNewTeam.id },
        team: { id: userwithNewTeam.team.id },
        endDate: IsNull(),
      });
      expect(teamHistoryRepository.save).not.toHaveBeenCalled();

      expect(roleRepository.save).toHaveBeenCalledWith(
        new RoleEntity({
          role: Role.Volunteer,
          additionalInfo: userwithNewTeam.team.id,
          user: userwithNewTeam,
        }),
      );
      expect(firebaseAuthService.addRoleToUser).toHaveBeenCalledWith(
        userwithNewTeam.firebaseUid,
        Role.Volunteer,
        userwithNewTeam.team.id,
      );
    });

    it('should add Volunteer role to user - teamId', async () => {
      const newTeam = new Team({ id: 2, region: new Region({ id: 1 }) });
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue({ ...activeUser });
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue({ ...newTeam });
      jest.spyOn(userRepository, 'find').mockResolvedValue([new User({})]);
      jest
        .spyOn(teamHistoryRepository, 'findBy')
        .mockResolvedValue([new TeamHistory({})]);

      await service.addRoleToUser(1, Role.Volunteer, null, 2);

      // addVolunteerRole
      expect(teamRepository.findOneBy).toHaveBeenCalledWith({
        id: 2,
      });

      // removeUserFromTeam
      expect(teamsService.maybeDeactivate).not.toHaveBeenCalled();

      expect(teamHistoryRepository.update).not.toHaveBeenCalled();

      // addUserToTeam
      const userwithNewTeam = {
        ...activeUser,
        team: newTeam,
      };

      expect(userRepository.save).toHaveBeenCalledWith(userwithNewTeam);
      expect(teamHistoryRepository.findBy).toHaveBeenCalledWith({
        user: { id: userwithNewTeam.id },
        team: { id: userwithNewTeam.team.id },
        endDate: IsNull(),
      });
      expect(teamHistoryRepository.save).not.toHaveBeenCalled();

      expect(roleRepository.save).toHaveBeenCalledWith(
        new RoleEntity({
          role: Role.Volunteer,
          additionalInfo: userwithNewTeam.team.id,
          user: userwithNewTeam,
        }),
      );
      expect(firebaseAuthService.addRoleToUser).toHaveBeenCalledWith(
        userwithNewTeam.firebaseUid,
        Role.Volunteer,
        userwithNewTeam.team.id,
      );
    });

    it('should throw an error if team does not exist', async () => {
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(undefined);

      await expect(
        service.addRoleToUser(1, Role.Volunteer, null, 2),
      ).rejects.toThrow(
        new BadRequestException('Team with the provided id does not exist.'),
      );
    });
  });

  describe('removeRoleFromUser', () => {
    const activeUser = new User({
      id: 1,
      firebaseUid: 'firebaseUid',
      active: true,
      roles: Promise.resolve([]),
    });

    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(activeUser);
    });

    it('should be defined', () => {
      expect(service.removeRoleFromUser).toBeDefined();
    });

    it('should throw an error if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(undefined);

      await expect(service.removeRoleFromUser(1, Role.Admin)).rejects.toThrow(
        new NotFoundException('User with the provided id does not exist.'),
      );
    });

    it('should remove Admin role from user', async () => {
      jest
        .spyOn(roleRepository, 'findBy')
        .mockResolvedValue([new RoleEntity()]);

      await service.removeRoleFromUser(1, Role.Admin);

      expect(roleRepository.findBy).toHaveBeenCalledWith({
        role: Role.Admin,
        user: { id: activeUser.id },
      });

      expect(roleRepository.remove).toHaveBeenCalledWith([new RoleEntity()]);
      expect(firebaseAuthService.removeRoleFromUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.Admin,
        undefined,
      );
    });

    it('should ommit saving the role if it does not exist', async () => {
      jest.spyOn(roleRepository, 'findBy').mockResolvedValue([]);

      await service.removeRoleFromUser(1, Role.Admin);

      expect(roleRepository.remove).not.toHaveBeenCalled();
      expect(firebaseAuthService.removeRoleFromUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.Admin,
        undefined,
      );
    });

    it('should remove RegionManager role from user', async () => {
      jest
        .spyOn(roleRepository, 'findBy')
        .mockResolvedValue([new RoleEntity()]);

      await service.removeRoleFromUser(1, Role.RegionManager, 1);

      expect(roleRepository.findBy).toHaveBeenCalledWith({
        role: Role.RegionManager,
        user: { id: activeUser.id },
        additionalInfo: 1,
      });

      expect(roleRepository.remove).toHaveBeenCalledWith([new RoleEntity()]);
      expect(firebaseAuthService.removeRoleFromUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.RegionManager,
        1,
      );
    });

    it('should remove RegionObserver role from user', async () => {
      jest
        .spyOn(roleRepository, 'findBy')
        .mockResolvedValue([new RoleEntity(), new RoleEntity()]);

      await service.removeRoleFromUser(1, Role.RegionObserver);

      expect(roleRepository.findBy).toHaveBeenCalledWith({
        role: Role.RegionObserver,
        user: { id: activeUser.id },
      });

      expect(roleRepository.remove).toHaveBeenCalledWith([
        new RoleEntity(),
        new RoleEntity(),
      ]);
      expect(firebaseAuthService.removeRoleFromUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.RegionObserver,
        undefined,
      );
    });
  });

  describe('removeRoleFromUser - Volunteer', () => {
    const activeUser = new User({
      id: 1,
      firebaseUid: 'firebaseUid',
      active: true,
      roles: Promise.resolve([]),
    });

    const teamUser = new User({
      ...activeUser,
      team: new Team({
        id: 1,
        region: new Region({ id: 1 }),
      }),
    });

    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(activeUser);
    });

    it('should remove Volunteer role from user', async () => {
      jest
        .spyOn(roleRepository, 'findBy')
        .mockResolvedValue([new RoleEntity()]);

      await service.removeRoleFromUser(1, Role.Volunteer);

      expect(roleRepository.findBy).toHaveBeenCalledWith({
        role: Role.Volunteer,
        user: { id: activeUser.id },
      });

      expect(teamHistoryRepository.update).toHaveBeenCalledWith(
        {
          user: { id: activeUser.id },
          endDate: IsNull(),
        },
        {
          endDate: expect.any(Date),
        },
      );

      expect(roleRepository.remove).toHaveBeenCalledWith([new RoleEntity()]);
      expect(firebaseAuthService.removeRoleFromUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.Volunteer,
        undefined,
      );
    });

    it('should remove Volunteer role from user - teamId', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ ...teamUser });
      jest
        .spyOn(roleRepository, 'findBy')
        .mockResolvedValue([new RoleEntity()]);
      jest.spyOn(userRepository, 'find').mockResolvedValue([new User({})]);

      await service.removeRoleFromUser(1, Role.Volunteer);

      expect(roleRepository.findBy).toHaveBeenCalledWith({
        role: Role.Volunteer,
        user: { id: activeUser.id },
      });

      expect(teamsService.maybeDeactivate).toHaveBeenCalledWith(teamUser.team);

      expect(teamHistoryRepository.update).toHaveBeenCalledWith(
        {
          user: { id: activeUser.id },
          endDate: IsNull(),
        },
        {
          endDate: expect.any(Date),
        },
      );

      expect(roleRepository.remove).toHaveBeenCalledWith([new RoleEntity()]);
      expect(firebaseAuthService.removeRoleFromUser).toHaveBeenCalledWith(
        activeUser.firebaseUid,
        Role.Volunteer,
        undefined,
      );
    });
  });

  describe('deactivateUser', () => {
    it('should be defined', () => {
      expect(service.deactivateUser).toBeDefined();
    });

    it('should throw an error if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(undefined);

      await expect(service.deactivateUser(1)).rejects.toThrow(
        new NotFoundException('User with the provided id does not exist.'),
      );
    });

    it('should deactivate user', async () => {
      const user = new User({ active: true, firebaseUid: 'firebaseUid' });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      await service.deactivateUser(1);

      expect(userRepository.save).toHaveBeenCalledWith(
        new User({ ...user, active: false }),
      );

      expect(firebaseAuthService.deactivateUser).toHaveBeenCalledWith(
        user.firebaseUid,
      );
      expect(teamsService.maybeDeactivate).not.toHaveBeenCalled();
    });

    it('should deactivate user with team', async () => {
      const user = new User({
        active: true,
        firebaseUid: 'firebaseUid',
        team: new Team({ id: 1 }),
      });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      await service.deactivateUser(1);

      expect(userRepository.save).toHaveBeenCalledWith(
        new User({ ...user, active: false }),
      );

      expect(firebaseAuthService.deactivateUser).toHaveBeenCalledWith(
        user.firebaseUid,
      );
      expect(teamsService.maybeDeactivate).toHaveBeenCalledWith(user.team);
    });
  });

  describe('activateUser', () => {
    it('should be defined', () => {
      expect(service.activateUser).toBeDefined();
    });

    it('should throw an error if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(undefined);

      await expect(service.activateUser(1)).rejects.toThrow(
        new NotFoundException('User with the provided id does not exist.'),
      );
    });

    it('should activate user', async () => {
      const user = new User({ active: false, firebaseUid: 'firebaseUid' });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      await service.activateUser(1);

      expect(userRepository.save).toHaveBeenCalledWith(
        new User({ ...user, active: true }),
      );

      expect(firebaseAuthService.activateUser).toHaveBeenCalledWith(
        user.firebaseUid,
      );
      expect(teamRepository.save).not.toHaveBeenCalled();
    });

    it('should activate user with team', async () => {
      const user = new User({
        active: false,
        firebaseUid: 'firebaseUid',
        team: new Team({ id: 1 }),
      });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      await service.activateUser(1);

      expect(userRepository.save).toHaveBeenCalledWith(
        new User({ ...user, active: true }),
      );

      expect(firebaseAuthService.activateUser).toHaveBeenCalledWith(
        user.firebaseUid,
      );
      expect(teamRepository.save).toHaveBeenCalledWith(
        new Team({ ...user.team, active: true }),
      );
    });
  });
});
