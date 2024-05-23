import { registerEnumType } from '@nestjs/graphql';

import {
  RabbitStatus,
  RabbitStatusHelper,
  valuesMap,
} from './rabbit-status.enum';

// We are re-exporting with a different name to make it more clear
// and make it possible to add more statuses in the future
export {
  RabbitStatus as RabbitGroupStatus,
  RabbitStatusHelper as RabbitGroupStatusHelper,
};

registerEnumType(RabbitStatus, {
  name: 'RabbitGroupStatus',
  description: 'Status of the rabbit group',
  valuesMap: valuesMap,
});
