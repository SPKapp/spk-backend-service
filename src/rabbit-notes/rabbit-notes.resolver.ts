import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitNote } from './entities/rabbit-note.entity';
import { CreateRabbitNoteInput } from './dto/create-rabbit-note.input';
import { UpdateRabbitNoteInput } from './dto/update-rabbit-note.input';

import {
  CurrentUser,
  FirebaseAuth,
  Role,
  UserDetails,
} from '../common/modules/auth/auth.module';
import { RabbitsService } from '../rabbits/rabbits/rabbits.service';

import {
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

@Resolver(() => RabbitNote)
export class RabbitNotesResolver {
  logger = new Logger(RabbitNotesResolver.name);

  constructor(
    private readonly rabbitNotesService: RabbitNotesService,
    private readonly rabbitsService: RabbitsService,
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
    @CurrentUser('ALL') currentUser: UserDetails,
    @Args('createRabbitNoteInput') createRabbitNoteInput: CreateRabbitNoteInput,
  ): Promise<RabbitNote> {
    let regionIds: number[] | undefined;
    let teamIds: number[] | undefined;

    if (currentUser.checkRole(Role.Admin)) {
    } else if (
      currentUser.checkRole([Role.RegionManager, Role.RegionObserver])
    ) {
      regionIds = currentUser.regions;

      if (!currentUser.checkRole(Role.RegionManager)) {
        if (createRabbitNoteInput.vetVisit) {
          throw new ForbiddenException(
            'Region Observer cannot create vet visits',
          );
        }
      }
    } else if (currentUser.checkRole(Role.Volunteer)) {
      teamIds = [currentUser.teamId];
    } else {
      this.logger.error(`User ${currentUser.uid} gets invalid access`);
      throw new InternalServerErrorException();
    }

    const rabbit = await this.rabbitsService.findOne(
      createRabbitNoteInput.rabbitId,
      regionIds,
      teamIds,
    );
    if (!rabbit) {
      throw new NotFoundException('Rabbit not found');
    }

    return this.rabbitNotesService.create(
      createRabbitNoteInput,
      currentUser.id,
    );
  }

  @Query(() => [RabbitNote], { name: 'rabbitNotes' })
  findAll() {
    // TODO: Implement this method
    return this.rabbitNotesService.findAll();
  }

  @Query(() => RabbitNote, { name: 'rabbitNote' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    // TODO: Implement this method
    return this.rabbitNotesService.findOne(id);
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
    const error = new ForbiddenException(
      'User is not allowed to update the note',
    );
    let allowed = false;

    if (currentUser.checkRole(Role.Admin)) {
      allowed = true;
    } else {
      const rabbitNote = await this.rabbitNotesService.findOne(
        updateRabbitNoteInput.id,
      );
      if (!rabbitNote) {
        throw error;
      }

      if (currentUser.checkRole(Role.RegionManager)) {
        if (
          currentUser.regions.includes(rabbitNote.rabbit.rabbitGroup.region.id)
        ) {
          allowed = true;
        }
      }
      if (
        !allowed &&
        currentUser.checkRole([Role.RegionObserver, Role.Volunteer]) &&
        rabbitNote.user.firebaseUid === currentUser.uid
      ) {
        allowed = true;
      }
    }

    if (!allowed) {
      throw error;
    }

    return this.rabbitNotesService.update(
      updateRabbitNoteInput.id,
      updateRabbitNoteInput,
    );
  }

  @Mutation(() => RabbitNote)
  removeRabbitNote(@Args('id', { type: () => Int }) id: number) {
    // TODO: Implement this method
    return this.rabbitNotesService.remove(id);
  }
}
