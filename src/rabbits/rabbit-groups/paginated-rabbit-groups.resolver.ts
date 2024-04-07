import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';

import {
  AuthService,
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth/auth.module';

import { RabbitGroupsService } from './rabbit-groups.service';

import { PaginatedRabbitGroups } from '../dto/paginated-rabbit-groups.output';
import { FindRabbitGroupsArgs } from '../dto/find-rabbit-groups.args';

@Resolver(() => PaginatedRabbitGroups)
export class PaginatedRabbitGroupsResolver {
  constructor(
    private readonly rabbitGroupsService: RabbitGroupsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Retrieves paginated rabbit groups based on the provided arguments.
   *
   * @param currentUser - The current user details.
   * @param args - The arguments for finding rabbit groups.
   * @returns A promise that resolves to a paginated list of rabbit groups.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => PaginatedRabbitGroups, { name: 'rabbitGroups' })
  async findAll(
    @CurrentUser() currentUser: UserDetails,
    @Args() args: FindRabbitGroupsArgs,
  ): Promise<PaginatedRabbitGroups> {
    let regionsIds = args.regionsIds;

    if (!currentUser.roles.includes(Role.Admin)) {
      if (regionsIds) {
        await this.authService.checkRegionManagerPermissions(
          currentUser,
          async () => regionsIds,
        );
      } else {
        regionsIds = currentUser.regions;
      }
    }

    return {
      ...(await this.rabbitGroupsService.findAllPaginated(
        args.offset,
        args.limit,
        regionsIds,
      )),
      transferToFieds: {
        regionsIds,
      },
    };
  }

  /**
   * Retrieves the total count of rabbit groups.
   *
   * @param parent - The parent object that should contain the transfer field `regionsIds`.
   * @returns The total count of rabbit groups.
   */
  @ResolveField('totalCount', () => Number)
  async totalCount(@Parent() parent: PaginatedRabbitGroups) {
    return this.rabbitGroupsService.count(parent.transferToFieds.regionsIds);
  }
}
