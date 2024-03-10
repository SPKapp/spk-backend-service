import { ObjectType } from '@nestjs/graphql';

import { Paginated } from '../../../functions/paginate.functions';
import { Region } from '../entities/region.entity';

@ObjectType()
export class PaginatedRegions extends Paginated(Region) {}
