import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { getGqlRequest } from '../../../functions/gql.functions';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return getGqlRequest(ctx).user;
  },
);
