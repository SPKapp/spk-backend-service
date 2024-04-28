import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { getGqlRequest } from '../../../functions/gql.functions';

export const CurrentUser = createParamDecorator(
  (data: string[] | string, ctx: ExecutionContext) => {
    return getGqlRequest(ctx).user;
  },
);
