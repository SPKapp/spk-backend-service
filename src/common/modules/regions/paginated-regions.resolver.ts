import { Args, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import { CurrentUser, FirebaseAuth, Role, UserDetails } from '../auth';
import {
  GqlFields,
  GqlFieldsName,
} from '../../decorators/gql-fields.decorator';

import { RegionsService } from './regions.service';
import { PaginatedRegions, FindRegionsArgs } from './dto';

@Resolver(() => PaginatedRegions)
export class PaginatedRegionsResolver {
  constructor(private readonly regionsService: RegionsService) {}

  /**
   * Retrieves all regions with pagination.
   *
   * @param args - The pagination arguments.
   * @returns A promise that resolves to a `PaginatedRegions` object containing the paginated regions data.
   * @throws {ForbiddenException} `wrong-arg-region`: User does not have access to at least one of the regions.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => PaginatedRegions, {
    name: 'regions',
    description: `
Retrieves all regions with pagination.

### Error codes:
- \`403\`, \`wrong-arg-region\`: User does not have access to at least one of the regions.
`,
  })
  async findAll(
    @CurrentUser() currentUser: UserDetails,
    @GqlFields(PaginatedRegions.name) gqlFields: GqlFieldsName,
    @Args() args: FindRegionsArgs,
  ): Promise<PaginatedRegions> {
    if (!currentUser.checkRole(Role.Admin)) {
      if (args.ids) {
        if (!currentUser.checkRegionManager(args.ids)) {
          throw new ForbiddenException(
            'User does not have access to at least one of the regions.',
            'wrong-arg-region',
          );
        }
      } else {
        args.ids = currentUser.managerRegions;
      }
    }

    return await this.regionsService.findAllPaginated(
      args,
      gqlFields.totalCount ? true : false,
    );
  }
}
