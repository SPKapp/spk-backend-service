import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegionsModule } from '../common/modules/regions/regions.module';

import { UsersService } from './users/users.service';
import { UsersResolver } from './users/users.resolver';
import { TeamsResolver } from './teams/teams.resolver';
import { TeamsService } from './teams/teams.service';

import { User } from './entities/user.entity';
import { Team } from './entities/team.entity';
import { PaginatedUsersResolver } from './users/paginated-users.resolver';
import { PaginatedTeamsResolver } from './teams/paginated-teams.resolver';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Team]), RegionsModule],
  providers: [
    UsersResolver,
    UsersService,
    TeamsResolver,
    TeamsService,
    PaginatedUsersResolver,
    PaginatedTeamsResolver,
  ],
  exports: [UsersService],
})
export class UsersModule {}
