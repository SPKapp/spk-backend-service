import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EntityWithId {
  constructor(id: number) {
    this.id = id;
  }

  @Field(() => ID)
  id: number;
}
