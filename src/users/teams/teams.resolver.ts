import {
  Args,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import { TeamsService } from './teams.service';
import { FirebaseAuth } from '../../common/modules/auth/firebase-auth/firebase-auth.decorator';
import { CurrentUser } from '../../common/modules/auth/current-user/current-user.decorator';

import { UserDetails } from '../../common/modules/auth/current-user/current-user';
import { Team } from '../entities/team.entity';
import { Role } from '../../common/modules/auth/roles.eum';
import { AuthService } from '../../common/modules/auth/auth.service';

@Resolver(() => Team)
export class TeamsResolver {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Retrieves all teams.
   * If the user is an Admin, all teams are returned.
   * If the user is a Region Manager, only teams from his regions are returned.
   * @param user - The current user details.
   * @returns A promise that resolves to an array of teams.
   */
  // TODO: Add pagination
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => [Team], { name: 'teams' })
  async findAll(@CurrentUser() user: UserDetails): Promise<Team[]> {
    if (!user.roles.includes(Role.Admin)) {
      return await this.teamsService.findAll(user.regions);
    }
    return await this.teamsService.findAll(undefined);
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

    if (!user.roles.includes(Role.Admin)) {
      await this.authService.checkRegionManagerPermissions(
        user,
        async () => {
          await findTeam();
          return team.region.id;
        },
        'Team does not belong to the Region Manager permissions.',
      );
    } else {
      await findTeam();
    }
    return team;

    async function findTeam() {
      team = await this.teamsService.findOne(id);
      if (!team) {
        throw new ForbiddenException(
          'Team does not belong to the Region Manager permissions.',
        );
      }
    }
  }

  @ResolveField('users')
  users(@Parent() team: Team) {
    // TODO: Czy wolontariusz będzie w stanie wyświetlić dowolne dane o innych wolontariuszach?
    return team.users;
  }
}
