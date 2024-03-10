import { ObjectType } from '@nestjs/graphql';

import { Paginated } from '../../common/functions/paginate.functions';
import { User } from '../entities/user.entity';

@ObjectType()
export class PaginatedUsers extends Paginated(User) {}
