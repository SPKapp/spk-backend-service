import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthService } from '../../common/modules/auth/auth.service';
import { UsersService } from './users.service';

import { UserDetails } from '../../common/modules/auth/current-user/current-user';
import { CurrentUser } from '../../common/modules/auth/current-user/current-user.decorator';
import { FirebaseAuth } from '../../common/modules/auth/firebase-auth/firebase-auth.decorator';
import { Role } from '../../common/modules/auth/roles.eum';

import { FindAllUsersArgs } from '../dto/find-all-users.args';
import { PaginatedUsers } from '../dto/paginated-users.output';

@Resolver(() => PaginatedUsers)
export class PaginatedUsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Retrieves a list of users based on the provided regionId.
   * If the user is not an admin, the method checks for region manager permissions.
   * If regionId is provided, it retrieves users for that specific region.
   * If regionId is not provided, it retrieves users for all regions associated with the user.
   *
   * @param user - The current user details.
   * @param args - The arguments for  pagination (offset, limit) and filtering (regionId).
   * @returns A promise that resolves to an array of User objects.
   * @throws {ForbiddenException} if the user region ID does not match the Region Manager permissions.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => PaginatedUsers, { name: 'users' })
  /**
   * Retrieves a paginated list of users.
   *
   * @param currentUser - The current user details.
   * @param args - The arguments for filtering and pagination.
   * @returns A promise that resolves to a `PaginatedUser` object containing the paginated user data.
   */
  async findAll(
    @CurrentUser() currentUser: UserDetails,
    @Args() args: FindAllUsersArgs,
  ): Promise<PaginatedUsers> {
    let regionsIds = args.regionId ? [args.regionId] : undefined;

    if (!currentUser.roles.includes(Role.Admin)) {
      if (args.regionId) {
        await this.authService.checkRegionManagerPermissions(
          currentUser,
          async () => args.regionId,
        );
      } else {
        regionsIds = currentUser.regions;
      }
    }

    return {
      data: await this.usersService.findAll(
        regionsIds,
        args.offset,
        args.limit,
      ),
      offset: args.offset,
      limit: args.limit,

      transferToFieds: {
        regionsIds: regionsIds,
      },
    };
  }

  @ResolveField('totalCount', () => Number)
  async totalCount(@Parent() paginatedUsers: PaginatedUsers): Promise<number> {
    return await this.usersService.count(
      paginatedUsers.transferToFieds.regionsIds,
    );
  }
}
