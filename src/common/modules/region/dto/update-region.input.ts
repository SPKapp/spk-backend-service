import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

import { CreateRegionInput } from './create-region.input';

@InputType()
export class UpdateRegionInput extends PartialType(CreateRegionInput) {
  @Field(() => Int)
  id: number;
}
