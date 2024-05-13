import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { PaginationArgs } from '../../common/functions/paginate.functions';

@ArgsType()
export class FindAllTeamsArgs extends PaginationArgs {
  @Field(() => [ID], {
    nullable: true,
    description: 'Specifies the IDs of the regions to filter teams.',
  })
  @Transform(({ value }) => value.map(Number))
  regionsIds?: number[];

  @Field({
    nullable: true,
    defaultValue: true,
    description: 'Specifies whether to filter active teams.',
  })
  isActive?: boolean;
}
