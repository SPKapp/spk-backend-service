import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  AuthService,
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth/auth.module';

import { RabbitGroupsService } from './rabbit-groups.service';

import { RabbitGroup } from '../entities/rabbit-group.entity';

@Resolver(() => RabbitGroup)
export class RabbitGroupsResolver {
  constructor(
    private readonly rabbitGroupsService: RabbitGroupsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Finds a rabbit group by its ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the rabbit group to find.
   * @returns A promise that resolves to the found rabbit group.
   * @throws {NotFoundException} if the rabbit group with the specified ID is not found.
   * @throws {ForbiddenException} if the current user does not have the required permissions.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager, Role.Volunteer)
  @Query(() => RabbitGroup, { name: 'rabbitGroup' })
  async findOne(
    @CurrentUser('teamId') currentUser: UserDetails,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<RabbitGroup> {
    const ERROR_REGION_MANAGER =
      'Rabbit Group does not belong to the Region Manager permissions.';
    const ERROR_VOLUNTEER =
      'Rabbit Group does not belong to the Volunteer permissions.';

    let rabbitGroup: RabbitGroup | null = null;

    if (currentUser.roles.includes(Role.Admin)) {
      rabbitGroup = await this.rabbitGroupsService.findOne(id);
      if (!rabbitGroup) {
        throw new NotFoundException(`Rabbit Group with ID ${id} not found`);
      }
      return rabbitGroup;
    }

    await this.authService.checkRegionManagerPermissions(
      currentUser,
      async () => {
        rabbitGroup = await this.rabbitGroupsService.findOne(id);
        if (!rabbitGroup) {
          throw new ForbiddenException(ERROR_REGION_MANAGER);
        }
        return rabbitGroup.region.id;
      },
      ERROR_REGION_MANAGER,
    );

    if (!rabbitGroup) {
      await this.authService.checkVolunteerPermissions(
        currentUser,
        async () => {
          rabbitGroup = await this.rabbitGroupsService.findOne(id);
          if (!rabbitGroup) {
            throw new ForbiddenException(ERROR_VOLUNTEER);
          }
          return rabbitGroup.team.id;
        },
        ERROR_VOLUNTEER,
      );
    }

    return rabbitGroup;
  }
}
