import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionType {
  HandedOver = 'HandedOver',
  Found = 'Found',
  Returned = 'Returned',
}

registerEnumType(AdmissionType, {
  name: 'AdmissionType',
  description: 'Admission type of the rabbit',
  valuesMap: {
    HandedOver: {
      description: 'The rabbit was handed over to fundation',
    },
    Found: {
      description: 'The rabbit was found',
    },
    Returned: {
      description:
        'The rabbit was previously addopted, but returned to fundation',
    },
  },
});
