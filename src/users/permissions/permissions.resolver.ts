import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import {
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

import {
  CurrentUser,
  FirebaseAuth,
  Role,
  UserDetails,
} from '../../common/modules/auth';

import { PermissionsService } from './permissions.service';
import { RoleEntity } from '../entities';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';

@Resolver(() => RoleEntity)
export class PermissionsResolver {
  logger = new Logger(PermissionsResolver.name);
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly teamsService: TeamsService,
    private readonly usersService: UsersService,
  ) {}

  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => Role, {
    description: `Adds a role to a user.
    - 'Role.Admin': regionId and teamId are ignored.
    - 'Role.RegionManager' and 'Role.RegionObserver': This method should be called separately for each region. regionId is required.
    - 'Role.Volunteer': User can have only one volunteer role, so if the user already has a volunteer role, it will be replaced.`,
  })
  async addRoleToUser(
    @CurrentUser() currentUser: UserDetails,
    @Args('userId', {
      type: () => ID,
    })
    userIdArg: string,
    @Args('role', {
      type: () => Role,
    })
    role: Role,
    @Args('regionId', {
      type: () => ID,
      nullable: true,
      description: `Used with RegionManager, RegionObserver, and Volunteer roles.
      Required for RegionManager and RegionObserver roles.
      `,
    })
    regionIdArg?: string,
    @Args('teamId', {
      type: () => ID,
      nullable: true,
      description: `Used only with Volunteer role. 
      - If provided, the user will be added to the team.
      - If regionId is provided, the user will be added to new team in the region with regionId.
      - If regionId is not provided, but the user is already in a team, the user will be added to new team in the same region.
      - Otherwise, fails.`,
    })
    teamIdArg?: string,
  ): Promise<Role> {
    const userId = Number(userIdArg);
    const regionId = regionIdArg ? Number(regionIdArg) : undefined;
    const teamId = teamIdArg ? Number(teamIdArg) : undefined;

    if (!currentUser.checkRole(Role.Admin)) {
      if (role === Role.Admin) {
        throw new ForbiddenException(
          'Only Admin can add Admin role to a user.',
        );
      }

      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new BadRequestException('User not found.');
      }
      if (!currentUser.checkRegionManager(user.region.id)) {
        throw new ForbiddenException(
          "User doesn't have permissions to add the role in userId region.",
        );
      }

      if (role === Role.RegionManager || role === Role.RegionObserver) {
        if (!regionId) {
          throw new BadRequestException(
            'Region ID is required for RegionManager and RegionObserver roles.',
          );
        }

        if (!currentUser.checkRegionManager(regionId)) {
          console.log('currentUser.managerRegions', currentUser.managerRegions);
          throw new ForbiddenException(
            "User doesn't have permissions to add the role in this region.",
          );
        }
      }

      if (role === Role.Volunteer) {
        if (teamId) {
          const team = await this.teamsService.findOne(
            teamId,
            currentUser.managerRegions,
          );
          if (!team) {
            throw new ForbiddenException(
              "User doesn't have permissions to add the role in this team.",
            );
          }
        } else if (regionId) {
          if (!currentUser.checkRegionManager(regionId)) {
            throw new ForbiddenException(
              "User doesn't have permissions to add the role in this region.",
            );
          }
        }
      }
    }

    await this.permissionsService.addRoleToUser(userId, role, regionId, teamId);

    return role;
  }

  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => Role, {
    description: `Removes a role from a user.
      - 'Role.Admin': regionId and teamId are ignored.
      - 'Role.RegionManager' and 'Role.RegionObserver': This method should be called separately for each region. regionId is required.
      - 'Role.Volunteer': User can have only one volunteer role, so if the user already has a volunteer role, it will be replaced.`,
  })
  async removeRoleFromUser(
    @CurrentUser() currentUser: UserDetails,
    @Args('userId', {
      type: () => ID,
    })
    userIdArg: string,
    @Args('role', {
      type: () => Role,
    })
    role: Role,
    @Args('regionId', {
      type: () => ID,
      nullable: true,
      description: `Used with RegionManager, RegionObserver, and Volunteer roles.
      Required for RegionManager and RegionObserver roles.
      `,
    })
    regionIdArg?: string,
  ): Promise<Role> {
    const userId = Number(userIdArg);
    const regionId = regionIdArg ? Number(regionIdArg) : undefined;

    if (!currentUser.checkRole(Role.Admin)) {
      if (role === Role.Admin) {
        throw new ForbiddenException(
          'Only Admin can remove Admin role from a user.',
        );
      }

      if (role === Role.RegionManager || role === Role.RegionObserver) {
        if (!regionId) {
          throw new BadRequestException(
            'Region ID is required for RegionManager and RegionObserver roles.',
          );
        }

        if (!currentUser.checkRegionManager(regionId)) {
          throw new ForbiddenException(
            "User doesn't have permissions to remove the role from this region.",
          );
        }
      }

      if (role === Role.Volunteer) {
        const user = await this.usersService.findOne(userId);
        if (!user) {
          throw new BadRequestException('User not found.');
        }
        if (!currentUser.checkRegionManager(user.region.id)) {
          throw new ForbiddenException(
            "User doesn't have permissions to remove the role from this region.",
          );
        }
      }
    }

    await this.permissionsService.removeRoleFromUser(userId, role, regionId);

    return role;
  }
}
