import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegionModule } from '../common/modules/region/region.module';
import { AuthModule } from '../common/modules/auth/auth.module';

import { UsersService } from './users/users.service';
import { UsersResolver } from './users/users.resolver';
import { TeamsResolver } from './teams/teams.resolver';
import { TeamsService } from './teams/teams.service';

import { User } from './entities/user.entity';
import { Team } from './entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team]), RegionModule, AuthModule],
  providers: [UsersResolver, UsersService, TeamsResolver, TeamsService],
})
export class UsersModule {}
