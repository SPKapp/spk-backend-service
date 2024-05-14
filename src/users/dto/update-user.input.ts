import { Transform } from 'class-transformer';
import { CreateUserInput } from './create-user.input';
import { InputType, Field, PartialType, ID, OmitType } from '@nestjs/graphql';

@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['regionId'] as const),
) {
  @Field(() => ID)
  @Transform(({ value }) => Number(value))
  id: number;
}
