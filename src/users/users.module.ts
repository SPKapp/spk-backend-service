import { Module } from '@nestjs/common';

import { UsersService } from './users/users.service';
import { UsersResolver } from './users/users.resolver';
import { TeamsResolver } from './teams/teams.resolver';
import { TeamsService } from './teams/teams.service';

@Module({
  providers: [UsersResolver, UsersService, TeamsResolver, TeamsService],
})
export class UsersModule {}
