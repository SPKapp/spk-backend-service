import { registerEnumType } from '@nestjs/graphql';

import {
  RabbitStatus,
  RabbitStatusHelper,
  valuesMap,
} from './rabbit-status.enum';

// We are re-exporting with a different name to make it more clear
// and make it possible to add more statuses in the future
export { RabbitStatusHelper as RabbitGroupStatusHelper };

// We must use Object.assign due to the way registerEnumType works
export type RabbitGroupStatus = RabbitStatus;
export const RabbitGroupStatus = Object.assign({}, RabbitStatus);

registerEnumType(RabbitGroupStatus, {
  name: 'RabbitGroupStatus',
  description: 'Status of the rabbit group',
  valuesMap: valuesMap,
});
