import { Resolver, Query, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../common/modules/auth/auth.module';
import {
  GqlFields,
  GqlFieldsName,
} from '../common/decorators/gql-fields.decorator';

import { RabbitNotesService } from './rabbit-notes.service';
import { FindRabbitNotesArgs, PaginatedRabbitNotes } from './dto';

import { RabbitsAccessService } from '../rabbits/rabbits-access.service';

@Resolver(() => PaginatedRabbitNotes)
export class PaginatedRabbitNoteResolver {
  logger = new Logger(PaginatedRabbitNoteResolver.name);

  constructor(
    private readonly rabbitNotesService: RabbitNotesService,
    private readonly rabbitsAccessService: RabbitsAccessService,
  ) {}

  /**
   * Retrieves all paginated rabbit notes for a specific rabbit.
   *
   * Note can be viewed by users that have access to the related rabbit
   * or users that created the note.
   *
   * @param currentUser - The current user details.
   * @param gqlFields - The GraphQL resolve info.
   * @param args - The arguments for finding rabbit notes.
   * @returns A promise that resolves to a paginated list of rabbit notes.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Query(() => PaginatedRabbitNotes, { name: 'rabbitNotes' })
  async findAll(
    @CurrentUser('ALL') currentUser: UserDetails,
    @GqlFields(PaginatedRabbitNotes.name) gqlFields: GqlFieldsName,
    @Args()
    args: FindRabbitNotesArgs,
  ): Promise<PaginatedRabbitNotes> {
    const hasAccess = await this.rabbitsAccessService.validateAccess(
      args.rabbitId,
      currentUser,
    );

    return this.rabbitNotesService.findAllPaginated(
      args.rabbitId,
      {
        offset: args.offset,
        limit: args.limit,
        createdAtFrom: args.createdAtFrom,
        createdAtTo: args.createdAtTo,
        withWeight: args.withWeight,
        vetVisit: args.vetVisit ?? args.isVetVisit,
        createdBy: hasAccess ? undefined : [currentUser.id],
      },
      gqlFields.totalCount ? true : false,
    );
  }
}
