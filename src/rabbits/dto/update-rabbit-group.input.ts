import { Field, ID, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { RabbitGroupStatus } from '../entities';

@InputType()
export class UpdateRabbitGroupInput {
  @Field(() => ID)
  @Transform(({ value }) => Number(value))
  id: number;

  @Field({
    nullable: true,
    description: `Description of the group for preparation for adoption.`,
  })
  adoptionDescription?: string;

  @Field({
    nullable: true,
    description: `The date the group was adopted.`,
  })
  adoptionDate?: Date;

  @Field({
    nullable: true,
    description: `Status of the group. Will be applied to all rabbits in the group.`,
  })
  status?: RabbitGroupStatus;
}
