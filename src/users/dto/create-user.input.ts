import { InputType, Field, ID } from '@nestjs/graphql';
import { IsEmail, IsPhoneNumber } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  firstname: string;

  @Field()
  lastname: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsPhoneNumber('PL')
  phone: string;

  // TODO: Add Adress field

  @Field(() => ID, { nullable: true })
  team_id?: number;

  @Field(() => ID, {
    nullable: true,
    description: 'Required when run as Admin.',
  })
  region_id?: number;
}
