import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EntityWithId {
  constructor(id: number) {
    this.id = id;
  }

  @Field(() => Int)
  id: number;
}
