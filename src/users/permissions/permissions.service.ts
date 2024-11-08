import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { RoleEntity, Team, TeamHistory, User } from '../entities';
import { FirebaseAuthService, Role } from '../../common/modules/auth';
import { RegionsService } from '../../common/modules/regions';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(TeamHistory)
    private readonly teamHistoryRepository: Repository<TeamHistory>,

    private readonly teamsSerivce: TeamsService,
    private readonly firebaseAuthService: FirebaseAuthService,
    @Inject(forwardRef(() => RegionsService))
    private readonly regionsService: RegionsService,
  ) {}

  /**
   * Adds a role to a user.
   *
   * 'Role.Admin':
   *      regionId and teamId are ignored.
   * 'Role.RegionManager' and 'Role.RegionObserver':
   *     This method should be called separately for each region.
   *     regionId is required.
   * 'Role.Volunteer':
   *     User can have only one volunteer role, so if the user already has a volunteer role, it will be replaced.
   *     If teamId is specified, the user is added to this team, else the user is added to a new team in his region.
   *
   * @param userId - The ID of the user to add the role to.
   * @param role - The role to add.
   * @param regionId - The ID of the region to add the role to.
   * @param teamId - The ID of the team to add the role to.
   * @throws {NotFoundException} - `user-not-found` If the user with the provided ID does not exist.
   * @throws {BadRequestException} - `user-not-active` If the user is not active.
   * @throws {BadRequestException} - `region-id-required` If additional information is required for this role.
   * @throws {NotFoundException} - `region-not-found` If the region with the provided ID does not exist.
   * @throws {NotFoundException} - `team-not-found` If the team with the provided ID does not exist.
   * @throws {BadRequestException} - `active-groups` If the old team has active RabbitGroups.
   */
  @Transactional()
  async addRoleToUser(
    userId: number,
    role: Role,
    regionId?: number,
    teamId?: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      relations: {
        roles: true,
      },
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(
        'User with the provided id does not exist.',
        'user-not-found',
      );
    }
    if (!user.active) {
      throw new BadRequestException('User is not active.', 'user-not-active');
    }

    let newRoleEntity: RoleEntity;
    switch (role) {
      case Role.Admin:
        newRoleEntity = new RoleEntity({ role, user });
        break;
      case Role.RegionManager:
      case Role.RegionObserver:
        if (!regionId) {
          throw new BadRequestException(
            'Additional information is required for this role.',
            'region-id-required',
          );
        }
        // We need to check if the region exists
        const region = await this.regionsService.findOne(regionId);
        if (!region) {
          throw new NotFoundException(
            'Region with the provided id does not exist.',
            'region-not-found',
          );
        }
        newRoleEntity = new RoleEntity({
          role,
          additionalInfo: regionId,
          user,
        });
        break;
      case Role.Volunteer:
        newRoleEntity = await this.addVolunteerRole(user, teamId);
        break;
    }

    if (
      !(await user.roles).some(
        (r) =>
          r.role === role && r.additionalInfo === newRoleEntity.additionalInfo,
      )
    ) {
      await this.roleRepository.save(newRoleEntity);
    }

    // Always run this method to ensure that the user has the role in Firebase
    await this.firebaseAuthService.addRoleToUser(
      user.firebaseUid,
      role,
      newRoleEntity.additionalInfo,
    );
    this.logger.log(
      `Added role ${role} with info: ${newRoleEntity.additionalInfo} to user ${user.id}`,
    );
  }

  /**
   * Adds a volunteer role to a user.
   * If the user already has a volunteer role, it will be replaced.
   *
   * If teamId is specified, the user is added to the team.
   * Else the user is added to a new team in his region.
   *
   * @throws {NotFoundException} - `team-not-found` If the team with the provided ID does not exist.
   * @throws {BadRequestException} - `active-groups` If the old team has active RabbitGroups.
   */
  @Transactional()
  private async addVolunteerRole(
    user: User,
    teamId: number,
  ): Promise<RoleEntity> {
    let team: Team;
    const oldTeam = user.team;

    if (teamId) {
      team = await this.teamRepository.findOneBy({ id: teamId });
      if (!team) {
        throw new NotFoundException(
          'Team with the provided id does not exist.',
          'team-not-found',
        );
      }
    } else {
      team = await this.teamsSerivce.create(user.region.id);
    }

    if (oldTeam && oldTeam.id !== team.id) {
      await this.removeUserFromTeam(user);

      // Remove old RoleEntity
      const oldRoleEntities = await this.roleRepository.findBy({
        user: { id: user.id },
        role: Role.Volunteer,
      });
      await this.roleRepository.remove(oldRoleEntities);
    }
    await this.addUserToTeam(user, team);

    return new RoleEntity({
      role: Role.Volunteer,
      additionalInfo: team.id,
      user,
    });
  }

  /**
   * Removes a role from a user.
   *
   * 'Role.Admin':
   *    regionId is ignored.
   * 'Role.RegionManager' and 'Role.RegionObserver':
   *    If regionId is not provided, role for all regions will be removed.
   *    If regionId is provided, role for the region will be removed.
   * 'Role.Volunteer':
   *    regionId is ignored.
   *
   * @param userId - The ID of the user to remove the role from.
   * @param role - The role to remove.
   * @param regionId - The ID of the region to remove the role from.
   * @throws {NotFoundException} - `user-not-found` If the user with the provided ID does not exist.
   * @throws {BadRequestException} - `active-groups` If the team has active RabbitGroups.
   */
  @Transactional()
  async removeRoleFromUser(
    userId: number,
    role: Role,
    regionId?: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      relations: {
        roles: true,
      },
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(
        'User with the provided id does not exist.',
        'user-not-found',
      );
    }

    let roleEntities: RoleEntity[];
    switch (role) {
      case Role.Admin:
      case Role.Volunteer:
        roleEntities = await this.roleRepository.findBy({
          user: { id: user.id },
          role,
        });
        break;
      case Role.RegionManager:
      case Role.RegionObserver:
        roleEntities = await this.roleRepository.findBy({
          user: { id: user.id },
          role,
          additionalInfo: regionId,
        });
        break;
    }

    if (role === Role.Volunteer) {
      // Always run this method to ensure that user is removed from the team
      await this.removeUserFromTeam(user);
    }

    // Always run this method to ensure that the user does not have the role in Firebase
    await this.firebaseAuthService.removeRoleFromUser(
      user.firebaseUid,
      role,
      regionId,
    );

    if (roleEntities.length === 0) {
      this.logger.warn(
        `User ${user.id} does not have role ${role} with info: ${regionId}`,
      );
      return;
    }

    await this.roleRepository.remove(roleEntities);

    this.logger.log(
      `Removed role ${role} with info: ${regionId} with to user ${user.id}`,
    );
  }

  /**
   * Adds a user to a team.
   *
   * This function assumes that the user is active.
   * It does not check if the user has the necessary permissions to be added to the team.
   * It does not check if user is already a member of any team.
   *
   * @param user - The user to add to the team.
   * @param team - The team to add the user to.
   */
  @Transactional()
  private async addUserToTeam(user: User, team: Team): Promise<void> {
    user.team = team;

    if (team.active === false) {
      // This situation should not happen, but we should handle it
      team.active = true;
      await this.teamRepository.save(team);
      this.logger.warn(`Team ${team.id} was inactive, activating it`);
    }

    user.region = team.region;
    await this.userRepository.save(user);

    const result = await this.teamHistoryRepository.findBy({
      user: { id: user.id },
      team: { id: team.id },
      endDate: IsNull(),
    });

    if (result.length > 0) {
      this.logger.warn(
        `User ${user.id} is already a member of team ${team.id}`,
      );
      return;
    }

    await this.teamHistoryRepository.save(
      new TeamHistory({
        user,
        team,
        startDate: new Date(),
      }),
    );

    this.logger.log(`Added user ${user.id} to team ${team.id}`);
  }

  /**
   * Removes a user from a team.
   *
   * If after removing the user from the team, the team has no active users
   * the team is archived or removed(if it hasn't any rabbits).
   *
   * @param user - The user to remove from the team.
   * @throws {BadRequestException} - `active-groups` If the team has active RabbitGroups.
   */
  @Transactional()
  private async removeUserFromTeam(user: User): Promise<void> {
    const team = user.team;

    user.team = null;
    await this.userRepository.save(user);

    if (team) {
      try {
        await this.teamsSerivce.maybeDeactivate(team);
      } catch (e) {
        if (e.response?.error === 'active-groups') {
          throw e;
        } else {
          throw new InternalServerErrorException(
            'An error occurred while deactivating the team.',
          );
        }
      }
    }

    // We shoud update the end date for every team
    await this.teamHistoryRepository.update(
      {
        user: { id: user.id },
        endDate: IsNull(),
      },
      {
        endDate: new Date(),
      },
    );

    if (team) {
      this.logger.log(`Removed user ${user.id} from team ${team.id}`);
    } else {
      this.logger.warn(`User ${user.id} is not a member of any team`);
    }
  }

  /**
   * Deactivates a user.
   *
   * If the user is a member of a team, maybe deactivate the team.
   *
   * @param userId - The ID of the user to deactivate.
   * @throws {NotFoundException} - `user-not-found` If the user with the provided ID does not exist.
   * @throws {BadRequestException} - `active-groups` If the team has active RabbitGroups.
   */
  @Transactional()
  async deactivateUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      relations: {
        team: true,
      },
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(
        'User with the provided id does not exist.',
        'user-not-found',
      );
    }

    user.active = false;
    await this.userRepository.save(user);

    // If the user is a member of a team, maybe deactivate the team
    if (user.team) {
      try {
        await this.teamsSerivce.maybeDeactivate(user.team);
      } catch (e) {
        if (e.response?.error === 'active-groups') {
          throw e;
        } else {
          throw new InternalServerErrorException(
            'An error occurred while deactivating the team.',
          );
        }
      }
    }

    await this.firebaseAuthService.deactivateUser(user.firebaseUid);

    this.logger.log(`Deactivated user ${user.id}`);
  }

  /**
   * Activates a user.
   *
   * If the user is a member of a team, activate the team.
   *
   * @param userId - The ID of the user to activate.
   * @throws {NotFoundException} - `user-not-found` If the user with the provided ID does not exist.
   */
  @Transactional()
  async activateUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      relations: {
        team: true,
      },
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(
        'User with the provided id does not exist.',
        'user-not-found',
      );
    }

    user.active = true;
    await this.userRepository.save(user);

    // If the user is a member of a team, activate the team
    if (user.team) {
      user.team.active = true;
      await this.teamRepository.save(user.team);
    }

    await this.firebaseAuthService.activateUser(user.firebaseUid);

    this.logger.log(`Activated user ${user.id}`);
  }

  /**
   * Removes all permissions for a region.
   *
   * Removes all 'Role.RegionManager' and 'Role.RegionObserver' roles for the region.
   *
   * @param regionId - The ID of the region to remove permissions for.
   */
  @Transactional()
  async removePermissionsForRegion(regionId: number): Promise<void> {
    const roleEntities = await this.roleRepository.findBy({
      role: In([Role.RegionManager, Role.RegionObserver]),
      additionalInfo: regionId,
    });

    for (const roleEntity of roleEntities) {
      await this.removeRoleFromUser(
        roleEntity.user.id,
        roleEntity.role,
        regionId,
      );
    }

    this.logger.log(`Removed permissions for region ${regionId}`);
  }
}
