import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { RoleEntity, Team, TeamHistory, User } from '../entities';
import { FirebaseAuthService, Role } from '../../common/modules/auth';
import { RegionsService } from '../../common/modules/regions/regions.service';
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
   *     If only teamId is specified, the user is added to the team.
   *     If only regionId is specified, the user is added to a new team in the region.
   *     If both regionId and teamId are not specified, the user is added to the team in the region that was in previous team or fail if the user has no previous team.
   *
   * @param userId - The ID of the user to add the role to.
   * @param role - The role to add.
   * @param regionId - The ID of the region to add the role to.
   * @param teamId - The ID of the team to add the role to.
   * @throws {NotFoundException} If the user with the provided ID does not exist.
   * @throws {BadRequestException} If the user is not active.
   * @throws {BadRequestException} If additional information is required for the role.
   * @throws {BadRequestException} If the region with the provided ID does not exist.
   * @throws {BadRequestException} If the team with the provided ID does not exist.
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
      throw new NotFoundException('User with the provided id does not exist.');
    }
    if (!user.active) {
      throw new BadRequestException('User is not active.');
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
          );
        }
        // We need to check if the region exists
        const region = await this.regionsService.findOne(regionId);
        if (!region) {
          throw new BadRequestException(
            'Region with the provided id does not exist.',
          );
        }
        newRoleEntity = new RoleEntity({
          role,
          additionalInfo: regionId,
          user,
        });
        break;
      case Role.Volunteer:
        newRoleEntity = await this.addVolunteerRole(user, regionId, teamId);
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
      `Added role ${role} with info: ${newRoleEntity.additionalInfo} with to user ${user.id}`,
    );
  }

  @Transactional()
  private async addVolunteerRole(
    user: User,
    regionId: number,
    teamId: number,
  ): Promise<RoleEntity> {
    let team: Team;
    const oldTeam = user.team;

    if (teamId) {
      // User can be added to active team only
      team = await this.teamRepository.findOneBy({ id: teamId, active: true });
      if (!team) {
        throw new BadRequestException(
          'Team with the provided id does not exist.',
        );
      }
    } else if (regionId) {
      // This method checks if the region exists - no need to check again
      team = await this.teamsSerivce.create(regionId);
    } else if (user.team) {
      team = await this.teamsSerivce.create(user.team.region.id);
    } else {
      throw new BadRequestException(
        'Additional information is required for this role.',
      );
    }

    if (oldTeam) {
      await this.removeUserFromTeam(user);
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
   * @throws {NotFoundException} If the user with the provided ID does not exist.
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
      throw new NotFoundException('User with the provided id does not exist.');
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
   * This function only adds the user to the team.
   * It does not check if the user has the necessary permissions to be added to the team.
   * It does not check if user is already a member of any team.
   *
   * @param user - The user to add to the team.
   * @param team - The team to add the user to.
   */
  @Transactional()
  private async addUserToTeam(user: User, team: Team): Promise<void> {
    user.team = team;

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
   */
  @Transactional()
  private async removeUserFromTeam(user: User): Promise<void> {
    const team = user.team;

    if (team) {
      // If team have other active users, do nothing
      const users = await this.userRepository.find({
        relations: {
          team: true,
        },
        where: {
          id: Not(user.id),
          active: true,
          team: {
            id: team.id,
          },
        },
      });

      if (users.length === 0) {
        // TODO:
        // If team have active rabbits - error
        // If team have inactive rabbits - archive them
        // If team have no rabbits, remove it
      }
    }

    user.team = undefined;
    await this.userRepository.save(user);

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
}
