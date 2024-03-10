import { ObjectType } from '@nestjs/graphql';

import { Paginated } from '../../common/functions/paginate.functions';
import { Team } from '../entities/team.entity';

@ObjectType()
export class PaginatedTeams extends Paginated(Team) {}
