import {
  ArgumentMetadata,
  ExecutionContext,
  Inject,
  Injectable,
  PipeTransform,
  createParamDecorator,
} from '@nestjs/common';
import { getGqlRequest } from '../../../functions/gql.functions';

import { UsersService } from '../../../../users/users/users.service';

import { UserDetails } from './current-user';

@Injectable()
export class getCurrentUserPipe implements PipeTransform {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  async transform(currentUser: UserDetails, metadata: ArgumentMetadata) {
    if (!metadata.data) return currentUser;

    if (metadata.data.includes('ALL')) {
      const user = await this.usersService.findOneByUid(currentUser.uid);

      currentUser.id = user.id;
      currentUser.teamId = user.team ? user.team.id : null;

      return currentUser;
    }
  }
}

const MakeCurrentUser = createParamDecorator(
  (data: string[] | string, ctx: ExecutionContext) => {
    return getGqlRequest(ctx).user;
  },
);

export const CurrentUser = (data?: string[] | string) =>
  MakeCurrentUser(data, getCurrentUserPipe);
