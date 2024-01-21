import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

import { RegionService } from './region.service';

import { Region } from './entities/region.entity';
import { CreateRegionInput } from './dto/create-region.input';
import { UpdateRegionInput } from './dto/update-region.input';
import { EntityWithId } from '../../types/remove.entity';

@Resolver(() => Region)
export class RegionResolver {
  constructor(private readonly regionService: RegionService) {}

  // TODO: Add authorization
  @Mutation(() => Region)
  async createRegion(@Args('input') input: CreateRegionInput) {
    return await this.regionService.create(input);
  }

  // TODO: Add authorization
  @Query(() => [Region], { name: 'regions' })
  async findAll() {
    return await this.regionService.findAll();
  }

  // TODO: Add authorization
  @Query(() => Region, { name: 'region' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return await this.regionService.findOne(id);
  }

  // TODO: Add authorization
  @Mutation(() => Region)
  async updateRegion(@Args('input') input: UpdateRegionInput) {
    return await this.regionService.update(input);
  }

  // TODO: Add authorization
  @Mutation(() => EntityWithId)
  async removeRegion(@Args('id', { type: () => Int }) id: number) {
    return new EntityWithId(await this.regionService.remove(id));
  }
}
