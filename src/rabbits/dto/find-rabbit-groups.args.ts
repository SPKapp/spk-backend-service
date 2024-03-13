import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { PaginationArgs } from '../../common/functions/paginate.functions';

@ArgsType()
export class FindRabbitGroupsArgs extends PaginationArgs {
  @Field(() => ID, { nullable: true })
  @Transform(({ value }) => parseInt(value, 10))
  regionId?: number;
}
