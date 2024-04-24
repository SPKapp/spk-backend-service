import { InputType, Field, PartialType, ID, OmitType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { CreateRabbitInput } from './create-rabbit.input';
import { AdmissionType, Gender } from '../entities';

@InputType({
  description:
    'The input type for updating a rabbit. Fields: name, admissionType, fillingDate can be modified only by Admin or RegionManager.',
})
export class UpdateRabbitInput extends PartialType(
  OmitType(CreateRabbitInput, ['rabbitGroupId', 'regionId'] as const),
) {
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
