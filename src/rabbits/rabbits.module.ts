import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RabbitsService } from './rabbits/rabbits.service';
import { RabbitsResolver } from './rabbits/rabbits.resolver';
import { RabbitGroupsResolver } from './rabbit-groups/rabbit-groups.resolver';
import { RabbitGroupsService } from './rabbit-groups/rabbit-groups.service';

import { Rabbit } from './entities/rabbit.entity';
import { RabbitGroup } from './entities/rabbit-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rabbit, RabbitGroup])],
  providers: [
    RabbitsResolver,
    RabbitsService,
    RabbitGroupsResolver,
    RabbitGroupsService,
  ],
})
export class RabbitsModule {}
