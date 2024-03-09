import { CreateUserInput } from './create-user.input';
import { InputType, Field, PartialType, ID, OmitType } from '@nestjs/graphql';

@InputType()
export class UpdateProfileInput extends PartialType(
  OmitType(CreateUserInput, ['teamId', 'regionId'] as const),
) {
  @Field(() => ID)
  firebaseUid: string;
}
