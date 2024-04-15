import { registerEnumType } from '@nestjs/graphql';

export enum VisitType {
  Control = 'Control',
  Vaccination = 'Vaccination',
  Deworming = 'Deworming',
  Treatment = 'Treatment',
  Operation = 'Operation',
  Castration = 'Castration',
  Chip = 'Chip',
}

registerEnumType(VisitType, {
  name: 'VisitType',
  description: 'Type of the vet visit',
  valuesMap: {
    Control: {
      description: 'Routine control visit',
    },
    Vaccination: {
      description: 'Vaccination visit',
    },
    Deworming: {
      description: 'Deworming visit',
    },
    Treatment: {
      description: 'Treatment visit',
    },
    Operation: {
      description: 'Operation visit',
    },
    Castration: {
      description: 'Castration visit',
    },
  },
});
