import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RabbitsResolver } from './rabbits/rabbits.resolver';
import { RabbitGroupsResolver } from './rabbit-groups/rabbit-groups.resolver';
import { PaginatedRabbitGroupsResolver } from './rabbit-groups/paginated-rabbit-groups.resolver';

import { RabbitsService } from './rabbits/rabbits.service';
import { RabbitGroupsService } from './rabbit-groups/rabbit-groups.service';
import { RabbitsAccessService } from './rabbits-access.service';

import { Rabbit, RabbitGroup } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Rabbit, RabbitGroup])],
  providers: [
    RabbitsResolver,
    RabbitGroupsResolver,
    PaginatedRabbitGroupsResolver,
    RabbitsService,
    RabbitGroupsService,
    RabbitsAccessService,
  ],
  exports: [RabbitsService, RabbitsAccessService],
})
export class RabbitsModule {}
