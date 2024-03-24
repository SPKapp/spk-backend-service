import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { CreateRabbitInput } from './create-rabbit.input';
import { Gender } from '../entities/gender.enum';
import { AdmissionType } from '../entities/admissionType.enum';

@InputType()
export class UpdateRabbitInput extends PartialType(CreateRabbitInput) {
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id: number;

  @Field(() => Gender, { nullable: true })
  gender?: Gender;

  @Field({ nullable: true })
  confirmedBirthDate?: boolean;

  @Field(() => AdmissionType, { nullable: true })
  admissionType?: AdmissionType;
}
