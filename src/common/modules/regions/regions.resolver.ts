import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { FirebaseAuth, Role, CurrentUser, UserDetails } from '../auth';

import { EntityWithId } from '../../types/remove.entity';

import { RegionsService } from './regions.service';

import { Region } from './entities/region.entity';
import { CreateRegionInput } from './dto/create-region.input';
import { UpdateRegionInput } from './dto/update-region.input';

@Resolver(() => Region)
export class RegionsResolver {
  constructor(private readonly regionsService: RegionsService) {}

  /**
   * Creates a new region.
   *
   * @param input - The input data for creating the region.
   * @returns A Promise that resolves to the created region.
   */
  @FirebaseAuth(Role.Admin)
  @Mutation(() => Region)
  async createRegion(@Args('input') input: CreateRegionInput): Promise<Region> {
    return await this.regionsService.create(input);
  }

  /**
   * Finds a region by its ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the region to find.
   * @returns A Promise that resolves to the found region.
   * @throws {ForbiddenException} If the region does not belong to the Region Manager permissions.
   * @throws {NotFoundException} If the region with the specified ID is not found.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => Region, { name: 'region' })
  async findOne(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => ID }) idArg: string,
  ): Promise<Region> {
    const id = Number(idArg);

    if (
      !currentUser.checkRole(Role.Admin) &&
      !currentUser.checkRegionManager(id)
    ) {
      throw new ForbiddenException(
        'Region does not belong to the Region Manager permissions.',
      );
    }

    const region = await this.regionsService.findOne(id);
    if (!region) {
      throw new NotFoundException(`Region not found`);
    }
    return region;
  }

  /**
   * Updates a region.
   *
   * @param input - The input data for updating the region.
   * @returns The updated region.
   * @throws {NotFoundException} if the region with the specified ID is not found.
   */
  @FirebaseAuth(Role.Admin)
  @Mutation(() => Region)
  async updateRegion(@Args('input') input: UpdateRegionInput): Promise<Region> {
    return await this.regionsService.update(input.id, input);
  }

  /**
   * Removes a region with the specified ID.
   * @param id - The ID of the region to remove.
   * @returns A new instance of `EntityWithId` representing the removed region.
   * @throws {NotFoundException} If the region with the specified ID is not found.
   * @throws {BadRequestException} If the region cannot be removed.
   */
  @FirebaseAuth(Role.Admin)
  @Mutation(() => EntityWithId)
  async removeRegion(
    @Args('id', { type: () => ID }) idArg: string,
  ): Promise<EntityWithId> {
    const id = Number(idArg);
    return new EntityWithId(await this.regionsService.remove(id));
  }
}
