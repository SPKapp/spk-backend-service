import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
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
   * @throws {ConflictException} `region-already-exists`: Region with the same name already exists.
   */
  @FirebaseAuth(Role.Admin)
  @Mutation(() => Region, {
    description: `
Creates a new region.

### Error codes:
- \`409\`, \`region-already-exists\`: Region with the same name already exists.
`,
  })
  async createRegion(@Args('input') input: CreateRegionInput): Promise<Region> {
    return await this.regionsService.create(input);
  }

  /**
   * Finds a region by its ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the region to find.
   * @returns A Promise that resolves to the found region.
   * @throws {ForbiddenException} `wrong-arg-region`: Region does not belong to the Region Manager permissions.
   * @throws {NotFoundException} `Region not found`: Region with the specified ID is not found.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => Region, {
    name: 'region',
    description: `
  Finds a region by its ID.

  ### Error codes:
  - \`403\`, \`wrong-arg-region\`: Region does not belong to the Region Manager permissions.
  - \`404\`, \`region-not-found\`: Region with the specified ID is not found.
  `,
  })
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
        'wrong-arg-region',
      );
    }

    const region = await this.regionsService.findOne(id);
    if (!region) {
      throw new NotFoundException(`Region not found`, 'region-not-found');
    }
    return region;
  }

  /**
   * Updates a region.
   *
   * @param input - The input data for updating the region.
   * @returns The updated region.
   * @throws {NotFoundException} `region-not-found`: Region with the specified ID is not found.
   * @throws {ConflictException} `region-already-exists`: Region with the same name already exists.
   */
  @FirebaseAuth(Role.Admin)
  @Mutation(() => Region, {
    description: `
Updates a region.

### Error codes:
- \`404\`, \`region-not-found\`: Region with the specified ID is not found.
- \`409\`, \`region-already-exists\`: Region with the same name already exists.
`,
  })
  async updateRegion(@Args('input') input: UpdateRegionInput): Promise<Region> {
    return await this.regionsService.update(input.id, input);
  }

  /**
   * Removes a region with the specified ID.
   * @param id - The ID of the region to remove.
   * @returns A new instance of `EntityWithId` representing the removed region.
   * @throws {NotFoundException} `region-not-found`: Region with the specified ID is not found.
   * @throws {BadRequestException} `region-in-use`: Region is in use and cannot be removed.
   */
  @FirebaseAuth(Role.Admin)
  @Mutation(() => EntityWithId, {
    description: `
Removes a region with the specified ID.
Region cannot be removed if it is in use. That means that there are any objects that are associated with this region.

### Error codes:
- \`404\`, \`region-not-found\`: Region with the specified ID is not found.
- \`400\`, \`region-in-use\`: Region is in use and cannot be removed.
`,
  })
  async removeRegion(
    @Args('id', { type: () => ID }) idArg: string,
  ): Promise<EntityWithId> {
    const id = Number(idArg);
    return new EntityWithId(await this.regionsService.remove(id));
  }
}
