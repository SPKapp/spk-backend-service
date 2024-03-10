import { Type } from '@nestjs/common';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

export interface IPaginatedType<T> {
  data: T[];
  offset?: number;
  limit?: number;
  totalCount?: number;
  transferToFieds?: any;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field(() => [classRef])
    data: T[];

    @Field(() => Int, { nullable: true })
    offset?: number;

    @Field(() => Int, { nullable: true })
    limit?: number;

    @Field(() => Int, { nullable: true })
    totalCount?: number;
  }

  return PaginatedType as Type<IPaginatedType<T>>;
}

@ArgsType()
export class PaginationArgs {
  @Field(() => Int)
  offset: number = 0;

  @Field(() => Int)
  limit: number = 10;
}
