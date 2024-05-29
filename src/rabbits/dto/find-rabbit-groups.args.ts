import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { PaginationArgs } from '../../common/functions/paginate.functions';
import {
  RabbitGroupStatus,
  RabbitStatus,
  RabbitStatusHelper,
} from '../entities';

@ArgsType()
export class FindRabbitGroupsArgs extends PaginationArgs {
  constructor() {
    super();
    this.rabbitStatus = RabbitStatusHelper.Active;
  }

  @Field(() => [ID], { nullable: true })
  @Transform(({ value }) => value.map(Number))
  regionsIds?: number[];

  @Field(() => [ID], { nullable: true })
  @Transform(({ value }) => value.map(Number))
  teamIds?: number[];

  @Field({ nullable: true })
  name?: string;

  @Field(() => [RabbitGroupStatus], { nullable: true })
  groupStatus?: RabbitGroupStatus[];

  @Field(() => [RabbitStatus], {
    nullable: true,
    defaultValue: RabbitStatusHelper.Active,
  })
  rabbitStatus?: RabbitStatus[];
}
