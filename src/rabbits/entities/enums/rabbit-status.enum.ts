import { registerEnumType } from '@nestjs/graphql';

export enum RabbitStatus {
  Submitted = 'Submitted',
  Treatment = 'Treatment',
  ToCastration = 'ToCastration',
  ToAdoption = 'ToAdoption',
  Adopted = 'Adopted',
  Dead = 'Dead',
}

registerEnumType(RabbitStatus, {
  name: 'RabbitStatus',
  description: 'Status of the rabbit',
  valuesMap: {
    Submitted: {
      description: 'The rabbit has been submitted, but not yet received',
    },
    Treatment: {
      description: 'The rabbit is currently in treatment',
    },
    ToCastration: {
      description: 'The rabbit is waiting for castration',
    },
    ToAdoption: {
      description: 'The rabbit is waiting for adoption',
    },
    Adopted: {
      description: 'The rabbit has been adopted',
    },
    Dead: {
      description: 'The rabbit has died',
    },
  },
});
