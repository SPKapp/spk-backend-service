import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth';

import { TeamsService } from './teams.service';

import { Team } from '../entities/team.entity';

@Resolver(() => Team)
export class TeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Retrieves a team by its ID.
   * If the user is an Admin, team is always returned.
   * If the user is a Region Manager, only teams from his regions are returned.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the team to retrieve.
   * @returns The team with the provided ID.
   * @throws {NotFoundException} if the team with the provided ID does not exist.
   * @throws {ForbiddenException} if the team does not belong to the Region Manager permissions.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => Team, { name: 'team' })
  async findOne(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => ID }) id: number,
  ): Promise<Team> {
    let team: Team | null = null;

    if (!currentUser.checkRole(Role.Admin)) {
      // TODO: Refactor this
      // await this.authService.checkRegionManagerPermissions(
      //   currentUser,
      //   async () => {
      //     team = await this.teamsService.findOne(id);
      //     if (!team) {
      //       throw new ForbiddenException(
      //         'Team does not belong to the Region Manager permissions.',
      //       );
      //     }
      //     return team.region.id;
      //   },
      //   'Team does not belong to the Region Manager permissions.',
      // );
    } else {
      team = await this.teamsService.findOne(id);
      if (!team) {
        throw new NotFoundException(`Team with ID ${id} not found`);
      }
    }
    return team;
  }
}
