import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';

import {
  CurrentUser,
  FirebaseAuth,
  Role,
  UserDetails,
} from '../common/modules/auth';
import { EntityWithId } from '../common/types';

import { RabbitNote } from './entities';
import { CreateRabbitNoteInput, UpdateRabbitNoteInput } from './dto';

import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitsAccessService } from '../rabbits';

@Resolver(() => RabbitNote)
export class RabbitNotesResolver {
  logger = new Logger(RabbitNotesResolver.name);

  constructor(
    private readonly rabbitNotesService: RabbitNotesService,
    private readonly rabbitsAccessService: RabbitsAccessService,
  ) {}

  /**
   * Creates a new rabbit note and vet visit for a rabbit.
   *
   * Note can be created by users with the following roles:
   * - Admin
   * - Region Manager - Region Manager can create notes for rabbits in their region.
   * - Region Observer - Region Observer can create notes for rabbits in their region,
   *                      but it is limited and cannot create vet visits.
   * - Volunteer - Volunteer can create notes for rabbits in their team.
   *
   * @param currentUser - The details of the current user.
   * @param createRabbitNoteInput - The input data for creating the rabbit note.
   * @returns The created rabbit note.
   *
   * @throws {ForbiddenException} if the user is not allowed to create a vet visit.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Mutation(() => RabbitNote)
  async createRabbitNote(
    @CurrentUser() currentUser: UserDetails,
    @Args('createRabbitNoteInput') createRabbitNoteInput: CreateRabbitNoteInput,
  ): Promise<RabbitNote> {
    const hasEditAccess = await this.rabbitsAccessService.validateAccess(
      createRabbitNoteInput.rabbitId,
      currentUser,
      true,
    );
    if (!hasEditAccess) {
      if (
        await this.rabbitsAccessService.validateAccess(
          createRabbitNoteInput.rabbitId,
          currentUser,
          false,
        )
      ) {
        if (createRabbitNoteInput.vetVisit) {
          throw new ForbiddenException(
            'Region Observer cannot create vet visits',
          );
        }
      } else {
        throw new ForbiddenException('User is not allowed to create a note');
      }
    }

    return this.rabbitNotesService.create(
      createRabbitNoteInput,
      currentUser.id,
    );
  }

  /**
   * Finds a rabbit note by its ID.
   *
   * Note can be viewed by users that have access to the related rabbit
   * or users that created the note.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the rabbit note to find.
   * @returns The found rabbit note.
   * @throws {ForbiddenException} If the user is not allowed to view the note.
   * @throws {NotFoundException} If the rabbit note is not found.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Query(() => RabbitNote, { name: 'rabbitNote' })
  async findOne(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => Int }) id: number,
  ) {
    const error = new ForbiddenException(
      'User is not allowed to view the note',
    );

    if (currentUser.checkRole(Role.Admin)) {
      const rabbitNote = await this.rabbitNotesService.findOne(id);
      if (!rabbitNote) {
        throw new NotFoundException('Rabbit note not found');
      }
      return rabbitNote;
    }

    const rabbitNote = await this.rabbitNotesService.findOne(id, {
      withRegion: true,
      withUser: true,
    });
    if (!rabbitNote) {
      throw error;
    }

    if (currentUser.checkRegion(rabbitNote.rabbit.rabbitGroup.region.id)) {
      return rabbitNote;
    }
    if (currentUser.checkVolunteer(rabbitNote.rabbit.rabbitGroup.team.id)) {
      return rabbitNote;
    }

    if (rabbitNote.user.firebaseUid === currentUser.uid) {
      return rabbitNote;
    }

    throw error;
  }

  /**
   * Updates a rabbit note.
   *
   * @param currentUser - The current user details.
   * @param updateRabbitNoteInput - The input data for updating the rabbit note.
   * @returns A promise that resolves to the updated rabbit note.
   * @throws {ForbiddenException} If the user is not allowed to update the note.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Mutation(() => RabbitNote)
  async updateRabbitNote(
    @CurrentUser() currentUser: UserDetails,
    @Args('updateRabbitNoteInput') updateRabbitNoteInput: UpdateRabbitNoteInput,
  ): Promise<RabbitNote> {
    await this.validateEditAccess(currentUser, updateRabbitNoteInput.id);

    return this.rabbitNotesService.update(
      updateRabbitNoteInput.id,
      updateRabbitNoteInput,
    );
  }

  /**
   * Removes a rabbit note by its ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the rabbit note to be removed.
   * @returns A promise that resolves to an object containing the ID of the removed rabbit note.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Mutation(() => EntityWithId)
  async removeRabbitNote(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EntityWithId> {
    const rabbitNoteId = parseInt(id, 10);

    await this.validateEditAccess(currentUser, rabbitNoteId);

    await this.rabbitNotesService.remove(rabbitNoteId);
    return { id: rabbitNoteId };
  }

  /**
   * Validates the edit access for a given user and rabbit note.
   *
   * The user is allowed to edit the note if:
   * - The user is an admin.
   * - The user is a region manager and has access to the region of the rabbit.
   * - The user is a region observer or volunteer and is the author of the note.
   *
   * @param currentUser - The details of the current user.
   * @param rabbitNoteId - The ID of the rabbit note.
   * @throws {ForbiddenException} - If the user is not allowed to update the note.
   */
  private async validateEditAccess(
    currentUser: UserDetails,
    rabbitNoteId: number,
  ): Promise<void> {
    const error = new ForbiddenException(
      'User is not allowed to edit the note',
    );

    if (currentUser.checkRole(Role.Admin)) {
      return;
    } else {
      const rabbitNote = await this.rabbitNotesService.findOne(rabbitNoteId, {
        withRegion: true,
        withUser: true,
      });
      if (!rabbitNote) {
        throw error;
      }

      if (
        currentUser.checkRegionManager(rabbitNote.rabbit.rabbitGroup.region.id)
      ) {
        return;
      }

      if (rabbitNote.user.firebaseUid === currentUser.uid) {
        return;
      }
    }

    throw error;
  }
}
