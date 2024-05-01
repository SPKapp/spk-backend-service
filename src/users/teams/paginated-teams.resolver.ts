import { Args, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth';
import {
  GqlFields,
  GqlFieldsName,
} from '../../common/decorators/gql-fields.decorator';

import { TeamsService } from './teams.service';

import { PaginatedTeams, FindAllTeamsArgs } from '../dto';

@Resolver(() => PaginatedTeams)
export class PaginatedTeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Retrieves all teams.
   * If the user is an Admin, all teams are returned.
   * If the user is a Region Manager, only teams from his regions are returned.
   * @param currentUser - The current user details.
   * @param args - The arguments for pagination.
   * @returns A promise that resolves to an array of teams.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => PaginatedTeams, { name: 'teams' })
  async findAll(
    @CurrentUser() currentUser: UserDetails,
    @GqlFields(PaginatedTeams.name) gqlFields: GqlFieldsName,
    @Args() args: FindAllTeamsArgs,
  ): Promise<PaginatedTeams> {
    if (!currentUser.checkRole(Role.Admin)) {
      if (args.regionsIds) {
        if (!currentUser.checkRegionManager(args.regionsIds)) {
          throw new ForbiddenException(
            'User does not have access to at least one of the regions.',
          );
        }
      } else {
        args.regionsIds = currentUser.managerRegions;
      }
    }

    return await this.teamsService.findAllPaginated(
      args,
      gqlFields.totalCount ? true : false,
    );
  }
}
