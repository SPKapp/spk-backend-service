import { ObjectType } from '@nestjs/graphql';

import { Paginated } from '../../common/functions/paginate.functions';
import { RabbitGroup } from '../entities/rabbit-group.entity';

@ObjectType()
export class PaginatedRabbitGroups extends Paginated(RabbitGroup) {}