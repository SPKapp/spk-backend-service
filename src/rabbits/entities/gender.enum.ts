import { registerEnumType } from '@nestjs/graphql';

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Unknown = 'Unknown',
}

registerEnumType(Gender, {
  name: 'Gender',
});
