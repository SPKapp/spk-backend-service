import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { PaginationArgs } from '../../../functions/paginate.functions';

@ArgsType()
export class FindRegionsArgs extends PaginationArgs {
  @Field(() => [ID], {
    nullable: true,
    description: 'The IDs of the regions to find.',
  })
  @Transform(({ value }) => value.map((v: string) => Number(v)))
  ids?: number[];

  @Field({
    nullable: true,
    description: `The name of the region to find.
      Filter is case-insensitive and finds by containing the name.`,
  })
  name?: string;
}
