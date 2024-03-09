import {
  Args,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';

import { TeamsService } from './teams.service';
import { FirebaseAuth } from '../../common/modules/auth/firebase-auth/firebase-auth.decorator';
import { CurrentUser } from '../../common/modules/auth/current-user/current-user.decorator';

import { UserDetails } from '../../common/modules/auth/current-user/current-user';
import { Team } from '../entities/team.entity';
import { Role } from '../../common/modules/auth/roles.eum';

@Resolver(() => Team)
export class TeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Retrieves all teams based on the provided region ID.
   * If the user is an Admin, all teams are returned.
   * If the user is a Region Manager, only teams from his regions are returned.
   * @param user - The current user details.
   * @param regionId - The ID of the region to filter teams by (optional).
   * @returns A promise that resolves to an array of teams.
   */
  // TODO: Add pagination
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => [Team], { name: 'teams' })
  async findAll(
    @CurrentUser() user: UserDetails,
    @Args('regionId', { type: () => ID, nullable: true })
    regionId?: number,
  ): Promise<Team[]> {
    regionId = regionId ? Number(regionId) : undefined;

    if (user.roles.includes(Role.Admin)) {
      return await this.teamsService.findAll(regionId ? [regionId] : undefined);
    } else if (user.roles.includes(Role.RegionManager)) {
      return await this.teamsService.findAll(
        regionId ? user.regions.filter((r) => r === regionId) : user.regions,
      );
    }

    return [];
  }

  /**
   * Retrieves a team by its ID.
   * If the user is an Admin, team is always returned.
   * If the user is a Region Manager, only teams from his regions are returned.
   *
   * @param user - The current user details.
   * @param id - The ID of the team to retrieve.
   * @returns The team with the provided ID.
   * @throws {NotFoundException} if the team with the provided ID does not exist.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => Team, { name: 'team' })
  async findOne(
    @CurrentUser() user: UserDetails,
    @Args('id', { type: () => ID }) id: number,
  ): Promise<Team> {
    let team: Team | null = null;

    if (user.roles.includes(Role.Admin)) {
      team = await this.teamsService.findOne(id);
    } else if (user.roles.includes(Role.RegionManager)) {
      team = await this.teamsService.findOne(id, user.regions);
    }

    if (!team) {
      throw new NotFoundException('Team with the provided id does not exist');
    }
    return team;
  }

  @ResolveField('users')
  users(@Parent() team: Team) {
    // TODO: Czy wolontariusz będzie w stanie wyświetlić dowolne dane o innych wolontariuszach?
    return team.users;
  }
}
