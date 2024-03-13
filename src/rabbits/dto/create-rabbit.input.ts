import { InputType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { AdmissionType } from '../entities/admissionType.enum';

@InputType()
export class CreateRabbitInput {
  @Field()
  name: string;

  @Field(() => AdmissionType, { defaultValue: AdmissionType.Found })
  admissionType: AdmissionType;

  @Field()
  color: string;

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
