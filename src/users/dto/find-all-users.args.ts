import { ArgsType, Field, ID } from '@nestjs/graphql';
import { PaginationArgs } from '../../common/functions/paginate.functions';
import { Transform } from 'class-transformer';

@ArgsType()
export class FindAllUsersArgs extends PaginationArgs {
  @Field(() => ID, { nullable: true })
  @Transform(({ value }) => parseInt(value, 10))
  regionId?: number;
}
