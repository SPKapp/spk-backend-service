import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { TeamsService } from './teams.service';
import { FirebaseAuth } from '../../common/modules/auth/firebase-auth/firebase-auth.decorator';
import { CurrentUser } from '../../common/modules/auth/current-user/current-user.decorator';
import { UserDetails } from '../../common/modules/auth/current-user/current-user';
import { Role } from '../../common/modules/auth/roles.eum';
import { PaginationArgs } from '../../common/functions/paginate.functions';

import { PaginatedTeams } from '../dto/paginated-teams.output';

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
    @Args() args: PaginationArgs,
  ): Promise<PaginatedTeams> {
    let regionsIds = undefined;

    if (!currentUser.roles.includes(Role.Admin)) {
      regionsIds = currentUser.regions;
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
