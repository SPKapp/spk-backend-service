import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRegionInput {
  @Field()
  name: string;
}
