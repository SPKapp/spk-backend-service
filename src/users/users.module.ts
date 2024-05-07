import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegionsModule } from '../common/modules/regions/regions.module';

import { UsersService } from './users/users.service';
import { UsersResolver } from './users/users.resolver';
import { TeamsResolver } from './teams/teams.resolver';
import { TeamsService } from './teams/teams.service';

import { User, Team, RoleEntity, TeamHistory } from './entities';
import { PaginatedUsersResolver } from './users/paginated-users.resolver';
import { PaginatedTeamsResolver } from './teams/paginated-teams.resolver';
import { PermissionsService } from './permissions/permissions.service';
import { PermissionsResolver } from './permissions/permissions.resolver';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Team, RoleEntity, TeamHistory]),
    RegionsModule,
  ],
  providers: [
    UsersResolver,
    UsersService,
    TeamsResolver,
    TeamsService,
    PaginatedUsersResolver,
    PaginatedTeamsResolver,
    PermissionsService,
    PermissionsResolver,
  ],
  exports: [UsersService, TeamsService, PermissionsService],
})
export class UsersModule {}
