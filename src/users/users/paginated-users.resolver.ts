import { Args, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth';
import {
  GqlFields,
  GqlFieldsName,
} from '../../common/decorators/gql-fields.decorator';

import { UsersService } from './users.service';

import { FindAllUsersArgs, PaginatedUsers } from '../dto';

@Resolver(() => PaginatedUsers)
export class PaginatedUsersResolver {
  constructor(private readonly usersService: UsersService) {}

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
    @GqlFields(PaginatedUsers.name) gqlFields: GqlFieldsName,
    @Args() args: FindAllUsersArgs,
  ): Promise<PaginatedUsers> {
    if (!currentUser.checkRole(Role.Admin)) {
      if (args.regionsIds) {
        if (!currentUser.checkRegionManager(args.regionsIds)) {
          throw new ForbiddenException(
            'User does not have access to at least one of the regions.',
          );
        }
      } else {
        args.regionsIds = currentUser.managerRegions;
      }
    }

    return await this.usersService.findAllPaginated(
      args,
      gqlFields.totalCount ? true : false,
    );
  }
}
