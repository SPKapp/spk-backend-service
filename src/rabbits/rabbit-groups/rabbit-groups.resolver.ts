import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth';

import { RabbitGroupsService } from './rabbit-groups.service';
import { RabbitGroup } from '../entities';
import { UpdateRabbitGroupInput } from '../dto';

@Resolver(() => RabbitGroup)
export class RabbitGroupsResolver {
  constructor(private readonly rabbitGroupsService: RabbitGroupsService) {}

  /**
   * Finds a rabbit group by its ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the rabbit group to find.
   * @returns A promise that resolves to the found rabbit group.
   * @throws {NotFoundException} if the rabbit group with the specified ID is not found based on the user's permissions.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Query(() => RabbitGroup, { name: 'rabbitGroup' })
  async findOne(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => ID }) idArg: string,
  ): Promise<RabbitGroup> {
    const id = Number(idArg);

    const filters = this.buildFilters(currentUser);

    const rabbitGroup = await this.rabbitGroupsService.findOne(
      id,
      filters.regionsIds,
      filters.teamsIds,
    );

    if (!rabbitGroup) {
      throw new NotFoundException('Rabbit Group not found.');
    }

    return rabbitGroup;
  }

  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Mutation(() => RabbitGroup)
  async updateRabbitGroup(
    @CurrentUser() currentUser: UserDetails,
    @Args('updateDto') updateDto: UpdateRabbitGroupInput,
  ): Promise<RabbitGroup> {
    return await this.rabbitGroupsService.update(
      updateDto.id,
      updateDto,
      this.buildFilters(currentUser),
    );
  }

  private buildFilters(currentUser: UserDetails): {
    regionsIds?: number[];
    teamsIds?: number[];
  } {
    const isAdmin = currentUser.checkRole(Role.Admin);
    const regional =
      !isAdmin &&
      currentUser.checkRole([Role.RegionManager, Role.RegionObserver]);
    const volunteer = !isAdmin && !regional;

    return {
      regionsIds: regional ? currentUser.regions : undefined,
      teamsIds: volunteer ? [currentUser.teamId] : undefined,
    };
  }

  /**
   * Updates the team for a specific rabbit group.
   *
   * @param currentUser - The current user details.
   * @param groupId - The ID of the rabbit group.
   * @param teamId - The ID of the team to be assigned to the rabbit group.
   * @returns A Promise that resolves to the updated rabbit group.
   * @throws {NotFoundException} if the rabbit group or team is not found.
   * @throws {BadRequestException} if the team is not active or the rabbit group has a different region than the team.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => RabbitGroup, {
    name: 'updateRabbitGroupTeam',
  })
  async updateTeam(
    @CurrentUser() currentUser: UserDetails,
    @Args('rabbitGroupId', { type: () => ID }) rabbitGroupIdArg: string,
    @Args('teamId', { type: () => ID }) teamIdArg: string,
  ) {
    const rabbitGroupId = Number(rabbitGroupIdArg);
    const teamId = Number(teamIdArg);

    return await this.rabbitGroupsService.updateTeam(
      rabbitGroupId,
      teamId,
      currentUser.checkRole(Role.Admin)
        ? undefined
        : currentUser.managerRegions,
    );
  }
}
