import { InputType, Field, ID, PartialType } from '@nestjs/graphql';

import { CreateRegionInput } from './create-region.input';

@InputType()
export class UpdateRegionInput extends PartialType(CreateRegionInput) {
  @Field(() => ID)
  id: number;
}
