import { registerEnumType } from '@nestjs/graphql';

export enum RabbitGroupStatus {
  Submitted = 'Submitted',
  Active = 'Active',
  Inactive = 'Inactive',
}

registerEnumType(RabbitGroupStatus, {
  name: 'RabbitGroupStatus',
  description: 'Status of the rabbit group',
  valuesMap: {
    Submitted: {
      description: 'The rabbit group has been submitted, but not yet received',
    },
    Active: {
      description: 'The rabbit group is currently in the foundation',
    },
    Inactive: {
      description: 'The rabbit group is no longer in the foundation',
    },
  },
});
