import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { FirebaseAuth } from '../auth/firebase-auth/firebase-auth.decorator';
import { Role } from '../auth/roles.eum';
import { PaginationArgs } from '../../functions/paginate.functions';

import { RegionsService } from './regions.service';
import { PaginatedRegions } from './dto/paginated-regions.output';

@Resolver(() => PaginatedRegions)
export class PaginatedRegionsResolver {
  constructor(private readonly regionsService: RegionsService) {}

  /**
   * Retrieves all regions with pagination.
   *
   * @param args - The pagination arguments (offset and limit).
   * @returns A promise that resolves to a `PaginatedRegions` object containing the paginated regions data.
   */
  @FirebaseAuth(Role.Admin)
  @Query(() => PaginatedRegions, { name: 'regions' })
  async findAll(@Args() args: PaginationArgs): Promise<PaginatedRegions> {
    return {
      data: await this.regionsService.findAll(args.offset, args.limit),
      offset: args.offset,
      limit: args.limit,
    };
  }

  @ResolveField('totalCount', () => Number)
  async totalCount(): Promise<number> {
    return await this.regionsService.count();
  }
}
