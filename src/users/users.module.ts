import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegionsModule } from '../common/modules/regions/regions.module';
import { AuthModule } from '../common/modules/auth/auth.module';

import { UsersService } from './users/users.service';
import { UsersResolver } from './users/users.resolver';
import { TeamsResolver } from './teams/teams.resolver';
import { TeamsService } from './teams/teams.service';

import { User } from './entities/user.entity';
import { Team } from './entities/team.entity';
import { PaginatedUsersResolver } from './users/paginated-users.resolver';
import { PaginatedTeamsResolver } from './teams/paginated-teams.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team]), RegionsModule, AuthModule],
  providers: [
    UsersResolver,
    UsersService,
    TeamsResolver,
    TeamsService,
    PaginatedUsersResolver,
    PaginatedTeamsResolver,
  ],
})
export class UsersModule {}
