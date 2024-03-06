import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users/users.service';
import { UsersResolver } from './users/users.resolver';
import { TeamsResolver } from './teams/teams.resolver';
import { TeamsService } from './teams/teams.service';

import { User } from './entities/user.entity';
import { Team } from './entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team])],
  providers: [UsersResolver, UsersService, TeamsResolver, TeamsService],
})
export class UsersModule {}
