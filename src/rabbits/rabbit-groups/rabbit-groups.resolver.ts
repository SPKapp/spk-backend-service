import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { RabbitGroupsService } from './rabbit-groups.service';
import { RabbitGroup } from '../entities/rabbit-group.entity';

@Resolver(() => RabbitGroup)
export class RabbitGroupsResolver {
  constructor(private readonly rabbitGroupsService: RabbitGroupsService) {}

  @Query(() => RabbitGroup, { name: 'rabbitGroup' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    // TODO: Implement this method
    return this.rabbitGroupsService.findOne(id);
  }
}
