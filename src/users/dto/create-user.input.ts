import { InputType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => (value.startsWith('+48') ? value : `+48${value}`))
  phone: string;

  // TODO: Add Adress field

  @Field(() => ID, {
    nullable: true,
    description: 'Required when run as Admin.',
  })
  @Transform(({ value }) => Number(value))
  regionId?: number;
}
