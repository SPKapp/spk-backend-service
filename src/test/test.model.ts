import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Author {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;
}
