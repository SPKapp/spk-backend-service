import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { TokensService } from './tokens.service';
import { CurrentUser, FirebaseAuth, UserDetails } from '../common/modules/auth';

@Resolver()
export class TokensResolver {
  constructor(private readonly tokenssService: TokensService) {}

  @FirebaseAuth()
  @Mutation(() => Boolean)
  async updateFcmToken(
    @CurrentUser() currentUser: UserDetails,
    @Args('token') token: string,
  ): Promise<boolean> {
    await this.tokenssService.update(currentUser.id, token);

    return true;
  }

  @FirebaseAuth()
  @Mutation(() => Boolean)
  async deleteFcmToken(
    @CurrentUser() currentUser: UserDetails,
    @Args('token') token: string,
  ): Promise<boolean> {
    await this.tokenssService.delete(currentUser.id, token);

    return true;
  }
}
