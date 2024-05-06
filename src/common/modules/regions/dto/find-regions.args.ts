import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { PaginationArgs } from '../../../functions/paginate.functions';

@ArgsType()
export class FindRegionsArgs extends PaginationArgs {
  @Field(() => [ID], { nullable: true })
  @Transform(({ value }) => value.map((v: string) => parseInt(v, 10)))
  ids?: number[];

  @Field({ nullable: true })
  name?: string;
}
