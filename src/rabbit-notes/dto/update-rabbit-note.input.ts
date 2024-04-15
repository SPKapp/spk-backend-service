import { InputType, Field, Int, PartialType, OmitType } from '@nestjs/graphql';

import {
  CreateRabbitNoteInput,
  VisitInfoInput,
} from './create-rabbit-note.input';

@InputType()
class UpdateVetVisitInput {
  @Field({
    nullable: true,
  })
  date?: Date;

  @Field(() => [VisitInfoInput], {
    nullable: true,
    description: 'If provided old visit info will be replaced with new one',
  })
  visitInfo?: VisitInfoInput[];
}

@InputType({
  description:
    "Type of note can't be changed. Cant add new vet visit to existing note",
})
export class UpdateRabbitNoteInput extends PartialType(
  OmitType(CreateRabbitNoteInput, ['rabbitId', 'vetVisit']),
) {
  @Field(() => Int)
  id: number;

  @Field(() => UpdateVetVisitInput, {
    nullable: true,
  })
  vetVisit?: UpdateVetVisitInput;
}
