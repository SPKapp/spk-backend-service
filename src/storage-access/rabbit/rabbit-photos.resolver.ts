import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import {
  CurrentUser,
  FirebaseAuth,
  Role,
  UserDetails,
} from '../../common/modules/auth';
import { RabbitPhotosAccessType, RabbitsAccessService } from '../../rabbits';
import { RabbitPhotosService } from './rabbit-photos.service';
import { TokenResult } from '../dto';

@Resolver()
export class RabbitPhotosResolver {
  constructor(
    private readonly rabbitPhotosService: RabbitPhotosService,
    private readonly rabbitsAccessService: RabbitsAccessService,
  ) {}

  /**
   * Generates a token for accessing the photos of a rabbit.
   *
   * [Full Info](../../../docs/description/rabbit-photos.md)
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the rabbit to generate the token for.
   * @returns The generated token.
   * @throws {ForbiddenException} if the user does not have access to the rabbit, or if user is an admin and the rabbit does not exist.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Query(() => TokenResult, {
    name: 'rabbitPhotosToken',
    description: `
Generates a token for accessing the photos of a rabbit.

If an admin gets ForbiddenException, it means that the rabbit does not exist.
    
Read documentation for more details.
`,
  })
  async getToken(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => ID }) idArg: string,
  ): Promise<TokenResult> {
    const id = Number(idArg);

    const accessType = await this.rabbitsAccessService.grantPhotoAccess(
      id,
      currentUser,
    );

    if (accessType == RabbitPhotosAccessType.Deny) {
      throw new ForbiddenException();
    }

    return {
      token: await this.rabbitPhotosService.generateToken(
        id,
        currentUser,
        accessType,
      ),
    };
  }
}
