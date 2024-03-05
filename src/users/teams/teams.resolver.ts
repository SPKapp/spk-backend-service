import { Resolver } from '@nestjs/graphql';

import { TeamsService } from './teams.service';

@Resolver()
export class TeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}
}
