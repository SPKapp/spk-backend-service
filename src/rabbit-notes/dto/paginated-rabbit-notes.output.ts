import { ObjectType } from '@nestjs/graphql';

import { Paginated } from '../../common/functions/paginate.functions';
import { RabbitNote } from '../entities';

@ObjectType()
export class PaginatedRabbitNotes extends Paginated(RabbitNote) {}
