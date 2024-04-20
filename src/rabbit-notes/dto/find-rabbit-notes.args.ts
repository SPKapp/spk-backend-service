import { ArgsType, Field, ID, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { PaginationArgs } from '../../common/functions/paginate.functions';
import { VisitType } from '../entities';

@InputType()
class VetVisitsArgs {
  @Field({
    nullable: true,
    description: 'Specifies the starting date for filtering visits.',
  })
  dateFrom?: Date;

  @Field({
    nullable: true,
    description: 'Specifies the ending date for filtering visits.',
  })
  dateTo?: Date;

  @Field(() => [VisitType], {
    nullable: true,
    description: 'Specifies the types of visits.',
  })
  visitTypes?: VisitType[];
}

@ArgsType()
export class FindRabbitNotesArgs extends PaginationArgs {
  @Field(() => ID, {
    description: 'ID of the rabbit to get notes for. Must be provided.',
  })
  @Transform(({ value }) => parseInt(value, 10))
  rabbitId: number;

  @Field({
    nullable: true,
    description:
      'Specifies the starting date for filtering notes based on creation date.',
  })
  createdAtFrom?: Date;

  @Field({
    nullable: true,
    description:
      'Specifies the ending date for filtering notes based on creation date.',
  })
  createdAtTo?: Date;

  @Field({
    nullable: true,
    description:
      'Specifies whether to return notes with weight. If false or undefined returns all notes.',
  })
  withWeight?: boolean;

  @Field({
    nullable: true,
    description:
      'Specifies if the note is related to a vet visit. If undefined, all notes are returned.',
  })
  isVetVisit?: boolean;

  @Field(() => VetVisitsArgs, {
    nullable: true,
    description:
      'Specifies filtering options for vet visits. If set, isVetVisit is ignored and only vet visits are returned.',
  })
  vetVisit?: VetVisitsArgs;
}
