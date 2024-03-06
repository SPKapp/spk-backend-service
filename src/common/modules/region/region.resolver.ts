import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

import { RegionService } from './region.service';

import { Region } from './entities/region.entity';
import { CreateRegionInput } from './dto/create-region.input';
import { UpdateRegionInput } from './dto/update-region.input';
import { EntityWithId } from '../../types/remove.entity';
import { FirebaseAuth } from '../auth/firebase-auth/firebase-auth.decorator';
import { Role } from '../auth/roles.eum';

// TODO: Check if the correct permissions are granted
@Resolver(() => Region)
export class RegionResolver {
  constructor(private readonly regionService: RegionService) {}

  @FirebaseAuth(Role.Admin)
  @Mutation(() => Region)
  async createRegion(@Args('input') input: CreateRegionInput) {
    return await this.regionService.create(input);
  }

  @FirebaseAuth(Role.Admin)
  @Query(() => [Region], { name: 'regions' })
  async findAll() {
    return await this.regionService.findAll();
  }

  @FirebaseAuth(Role.Admin)
  @Query(() => Region, { name: 'region' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    //TODO: Throw NotFoundException if team not found
    return await this.regionService.findOne(id);
  }

  @FirebaseAuth(Role.Admin)
  @Mutation(() => Region)
  async updateRegion(@Args('input') input: UpdateRegionInput) {
    return await this.regionService.update(input);
  }

  @FirebaseAuth(Role.Admin)
  @Mutation(() => EntityWithId)
  async removeRegion(@Args('id', { type: () => Int }) id: number) {
    return new EntityWithId(await this.regionService.remove(id));
  }
}
