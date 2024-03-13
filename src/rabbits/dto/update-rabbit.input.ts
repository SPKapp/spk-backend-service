import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { CreateRabbitInput } from './create-rabbit.input';

@InputType()
export class UpdateRabbitInput extends PartialType(CreateRabbitInput) {
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id: number;
}
