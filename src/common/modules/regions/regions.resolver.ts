import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
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
  async createRegion(@Args('input') input: CreateRegionInput) {
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
    @Args('id', { type: () => Int }) id: number,
  ) {
    let region: Region | null = null;

    if (!currentUser.checkRole(Role.Admin)) {
      // TODO: Refactor this
      // await this.authService.checkRegionManagerPermissions(
      //   currentUser,
      //   async () => {
      //     region = await this.regionsService.findOne(id);
      //     if (!region) {
      //       throw new ForbiddenException(
      //         'Region does not belong to the Region Manager permissions.',
      //       );
      //     }
      //     return region.id;
      //   },
      //   'Region does not belong to the Region Manager permissions.',
      // );
    } else {
      region = await this.regionsService.findOne(id);
      if (!region) {
        throw new NotFoundException(`Region with ID ${id} not found`);
      }
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
  async updateRegion(@Args('input') input: UpdateRegionInput) {
    return await this.regionsService.update(input.id, input);
  }

  /**
   * Removes a region with the specified ID.
   * @param id - The ID of the region to remove.
   * @returns A new instance of `EntityWithId` representing the removed region.
   * @throws {NotFoundException} If the region with the specified ID is not found.
   * @throws {BadRequestException} If the region is in use by a team.
   */
  @FirebaseAuth(Role.Admin)
  @Mutation(() => EntityWithId)
  async removeRegion(@Args('id', { type: () => Int }) id: number) {
    return new EntityWithId(await this.regionsService.remove(id));
  }
}
