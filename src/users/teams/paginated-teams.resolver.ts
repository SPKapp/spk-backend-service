import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth';

import { TeamsService } from './teams.service';

import { PaginatedTeams } from '../dto/paginated-teams.output';
import { FindAllTeamsArgs } from '../dto/find-all-teams.args';

@Resolver(() => PaginatedTeams)
export class PaginatedTeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Retrieves all teams.
   * If the user is an Admin, all teams are returned.
   * If the user is a Region Manager, only teams from his regions are returned.
   * @param currentUser - The current user details.
   * @param args - The arguments for pagination (offset, limit).
   * @returns A promise that resolves to an array of teams.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => PaginatedTeams, { name: 'teams' })
  async findAll(
    @CurrentUser() currentUser: UserDetails,
    @Args() args: FindAllTeamsArgs,
  ): Promise<PaginatedTeams> {
    let regionsIds = args.regionsIds;

    if (!currentUser.checkRole(Role.Admin)) {
      if (regionsIds) {
        // TODO: Refactor this
        // await this.authService.checkRegionManagerPermissions(
        //   currentUser,
        //   async () => regionsIds,
        // );
      } else {
        // TODO: Refactor this
        // regionsIds = currentUser.regions;
      }
    }

    return {
      data: await this.teamsService.findAll(
        regionsIds,
        args.offset,
        args.limit,
      ),
      offset: args.offset,
      limit: args.limit,

      transferToFieds: {
        regionsIds: regionsIds,
      },
    };
  }

  @ResolveField('totalCount', () => Number)
  async totalCount(@Parent() paginatedTeams: PaginatedTeams): Promise<number> {
    return await this.teamsService.count(
      paginatedTeams.transferToFieds.regionsIds,
    );
  }
}
