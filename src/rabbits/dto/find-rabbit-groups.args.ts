import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { PaginationArgs } from '../../common/functions/paginate.functions';

@ArgsType()
export class FindRabbitGroupsArgs extends PaginationArgs {
  @Field(() => [ID], { nullable: true })
  @Transform(({ value }) => value.map(Number))
  regionsIds?: number[];

  @Field(() => [ID], { nullable: true })
  @Transform(({ value }) => value.map(Number))
  teamIds?: number[];

  @Field({ nullable: true })
  name?: string;
}
