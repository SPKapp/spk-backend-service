import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

import { CreateRabbitNoteInput } from './create-rabbit-note.input';

@InputType()
export class UpdateRabbitNoteInput extends PartialType(CreateRabbitNoteInput) {
  @Field(() => Int)
  id: number;
}
