import { CreateUserInput } from './create-user.input';
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class UpdateProfileInput extends PartialType(
  OmitType(CreateUserInput, ['regionId'] as const),
) {}
