import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export function getGqlRequest(context: ExecutionContext) {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req;
}
