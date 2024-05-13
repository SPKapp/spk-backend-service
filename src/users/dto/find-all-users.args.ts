import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { PaginationArgs } from '../../common/functions/paginate.functions';

@ArgsType()
export class FindAllUsersArgs extends PaginationArgs {
  @Field(() => [ID], { nullable: true })
  @Transform(({ value }) => value?.map(Number))
  regionsIds?: number[];

  @Field({ nullable: true, defaultValue: true })
  isActive?: boolean;

  @Field({ nullable: true })
  name?: string;
}
