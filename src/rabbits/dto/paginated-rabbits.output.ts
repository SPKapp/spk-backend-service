import { ObjectType } from '@nestjs/graphql';

import { Paginated } from '../../common/functions/paginate.functions';
import { Rabbit } from '../entities/rabbit.entity';

@ObjectType()
export class PaginatedRabbits extends Paginated(Rabbit) {}
