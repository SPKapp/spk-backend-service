import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TokenResult {
  @Field(() => String)
  token: string;
}
