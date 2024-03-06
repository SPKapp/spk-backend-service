import { InputType, Field } from '@nestjs/graphql';
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
  // TODO: Add Team field
}
