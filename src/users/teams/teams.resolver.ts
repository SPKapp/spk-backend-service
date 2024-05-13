import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth';

import { TeamsService } from './teams.service';
import { Team } from '../entities';

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
    @Args('id', { type: () => ID }) idArg: string,
  ): Promise<Team> {
    const id = Number(idArg);
    const team = await this.teamsService.findOne(
      id,
      currentUser.checkRole(Role.Admin)
        ? undefined
        : currentUser.managerRegions,
    );
    if (!team) {
      throw new NotFoundException(`Team with the provided id not found.`);
    }
    return team;
  }
}
