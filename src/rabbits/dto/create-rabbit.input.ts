import { InputType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { MinLength } from 'class-validator';

import { AdmissionType } from '../entities/admissionType.enum';
import { Gender } from '../entities/gender.enum';

@InputType()
export class CreateRabbitInput {
  @Field()
  @MinLength(3)
  name: string;

  @Field({ nullable: true })
  color?: string;

  @Field({ nullable: true })
  breed?: string;

  @Field(() => Gender, { defaultValue: Gender.Unknown })
  gender: Gender;

  @Field({ nullable: true })
  birthDate?: Date;

  @Field({ defaultValue: false })
  confirmedBirthDate?: boolean;

  @Field({ nullable: true })
  admissionDate?: Date;

  @Field(() => AdmissionType, { defaultValue: AdmissionType.Found })
  admissionType: AdmissionType;

  @Field({ nullable: true })
  fillingDate?: Date;

  @Field(() => ID, {
    nullable: true,
    description: 'If not provided, a new RabbitGroup will be created.',
  })
  @Transform(({ value }) => parseInt(value, 10))
  rabbitGroupId?: number;

  @Field(() => ID, {
    nullable: true,
    description: 'Not required if rabbitGroupId is provided.',
  })
  @Transform(({ value }) => parseInt(value, 10))
  regionId?: number;
}
