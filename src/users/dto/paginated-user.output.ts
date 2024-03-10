import { ObjectType } from '@nestjs/graphql';

import { Paginated } from '../../common/functions/paginate.functions';
import { User } from '../entities/user.entity';

@ObjectType()
export class PaginatedUser extends Paginated(User) {}
