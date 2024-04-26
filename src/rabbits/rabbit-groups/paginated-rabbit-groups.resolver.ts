import { Resolver, Query, Args } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth/auth.module';
import {
  GqlFields,
  GqlFieldsName,
} from '../../common/decorators/gql-fields.decorator';

import { RabbitGroupsService } from './rabbit-groups.service';
import { PaginatedRabbitGroups, FindRabbitGroupsArgs } from '../dto';

@Resolver(() => PaginatedRabbitGroups)
export class PaginatedRabbitGroupsResolver {
  constructor(private readonly rabbitGroupsService: RabbitGroupsService) {}

  /**
   * Retrieves paginated rabbit groups based on the provided arguments.
   * Roles allowed:
   * - Admin: Can view all rabbit groups.
   * - RegionManager: Can view rabbit groups from the regions they manage.
   * - RegionObserver: Can view rabbit groups from the regions they observe.
   * - Volunteer: Can view rabbit groups from the regions they are assigned to.
   *
   * @param currentUser - The current user details.
   * @param gqlFields - The GraphQL resolve info.
   * @param args - The arguments for finding rabbit groups.
   * @returns A promise that resolves to a paginated list of rabbit groups.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Query(() => PaginatedRabbitGroups, { name: 'rabbitGroups' })
  async findAll(
    @CurrentUser('ALL') currentUser: UserDetails,
    @GqlFields(PaginatedRabbitGroups.name) gqlFields: GqlFieldsName,
    @Args() args: FindRabbitGroupsArgs,
  ): Promise<PaginatedRabbitGroups> {
    if (currentUser.checkRole(Role.Admin)) {
    } else if (
      currentUser.checkRole([Role.RegionManager, Role.RegionObserver])
    ) {
      // There is no check that teamIds belongs to one of user regions
      // In this case, database query will return empty array
      if (!args.regionsIds) {
        args.regionsIds = currentUser.regions;
      } else if (!currentUser.checkRegion(args.regionsIds)) {
        throw new ForbiddenException('Region ID does not match permissions.');
      }
    } else if (currentUser.checkRole(Role.Volunteer)) {
      args.teamIds = [currentUser.teamId];
    }

    return await this.rabbitGroupsService.findAllPaginated(
      args,
      gqlFields.totalCount ? true : false,
    );
  }
}
