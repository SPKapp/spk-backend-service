import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { TeamsService } from './teams.service';

import { Team } from '../entities/team.entity';

@Resolver(() => Team)
export class TeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  /* TODO: Add authorization
   * - Admin: all
   * - Region Manager: Teams from his region, without param only his teams
   */
  // TODO: Add pagination
  @Query(() => [Team], { name: 'teams' })
  findAll(
    @Args('region_name', { type: () => String, nullable: true })
    region: string,
  ) {
    return this.teamsService.findAll(region);
  }

  /* TODO: Add authorization
   * - Admin: all
   * - Region Manager: Teams from his region
   * - Team Member: His team
   */
  @Query(() => Team, { name: 'team' })
  findOne(@Args('id', { type: () => Number }) id: number) {
    // TODO: Throw NotFoundException if team not found
    return this.teamsService.findOne(id);
  }

  @ResolveField('users')
  async users(@Parent() team: Team) {
    return team.users;
  }
}
