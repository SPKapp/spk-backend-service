import { InputType, ID, Field, Float } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { VisitType } from '../entities';

@InputType()
export class VisitInfoInput {
  @Field(() => VisitType)
  visitType: VisitType;

  @Field({
    nullable: true,
  })
  additionalInfo?: string;
}

@InputType()
class CreateVetVisitInput {
  @Field({
    nullable: true,
    description: 'If not provided, the current date is used.',
  })
  date?: Date;

  @Field(() => [VisitInfoInput])
  visitInfo: VisitInfoInput[];
}

@InputType()
export class CreateRabbitNoteInput {
  @Field(() => ID)
  @Transform(({ value }) => Number(value))
  rabbitId: number;

  @Field({
    nullable: true,
  })
  description?: string;

  @Field(() => Float, {
    nullable: true,
  })
  weight?: number;

  @Field(() => CreateVetVisitInput, {
    nullable: true,
  })
  vetVisit?: CreateVetVisitInput;
}
