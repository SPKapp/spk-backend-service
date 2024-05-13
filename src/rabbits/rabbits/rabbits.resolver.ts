import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth';

import { EntityWithId } from '../../common/types';
import { Rabbit } from '../entities';
import { CreateRabbitInput, UpdateRabbitInput } from '../dto';

import { RabbitsService } from './rabbits.service';
import { RabbitsAccessService } from '../rabbits-access.service';

@Resolver(() => Rabbit)
export class RabbitsResolver {
  constructor(
    private readonly rabbitsService: RabbitsService,
    private readonly rabbitsAccessService: RabbitsAccessService,
  ) {}

  /**
   * Creates a new rabbit.
   *
   * @param currentUser - The current user details.
   * @param createRabbitInput - The input data for creating the rabbit.
   * @returns The created rabbit.
   * @throws {BadRequestException} if the provided data is invalid.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => Rabbit)
  async createRabbit(
    @CurrentUser() currentUser: UserDetails,
    @Args('createRabbitInput') createRabbitInput: CreateRabbitInput,
  ): Promise<Rabbit> {
    if (!createRabbitInput.rabbitGroupId && !createRabbitInput.regionId) {
      throw new BadRequestException('RegionId or RabbitGroupId is required');
    }

    if (!currentUser.checkRole(Role.Admin)) {
      if (createRabbitInput.rabbitGroupId) {
        if (
          !(await this.rabbitsAccessService.validateAccessForRabbitGroup(
            createRabbitInput.rabbitGroupId,
            currentUser,
          ))
        ) {
          throw new ForbiddenException(
            'Rabbit Group ID does not match the Region Manager permissions.',
          );
        }
      } else if (
        createRabbitInput.regionId &&
        !currentUser.checkRegion(createRabbitInput.regionId)
      ) {
        throw new ForbiddenException(
          'Region ID does not match the Region Manager permissions.',
        );
      }
    }

    return await this.rabbitsService.create(createRabbitInput);
  }

  /**
   * Retrieves a single rabbit by its ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the rabbit to retrieve.
   * @returns A Promise that resolves to the retrieved rabbit.
   * @throws {NotFoundException} if the rabbit with the specified ID is not found.
   */
  @FirebaseAuth(
    Role.Admin,
    Role.RegionManager,
    Role.RegionObserver,
    Role.Volunteer,
  )
  @Query(() => Rabbit, { name: 'rabbit' })
  async findOne(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => ID }) Arg: string,
  ): Promise<Rabbit> {
    const id = Number(Arg);

    const isAdmin = currentUser.checkRole(Role.Admin);
    const regional =
      !isAdmin &&
      currentUser.checkRole([Role.RegionManager, Role.RegionObserver]);
    const volunteer = !isAdmin && !regional;

    const rabbit = await this.rabbitsService.findOne(
      id,
      regional ? currentUser.regions : undefined,
      volunteer ? [currentUser.teamId] : undefined,
    );

    if (!rabbit) {
      throw new NotFoundException('Rabbit not found');
    }

    return rabbit;
  }

  /**
   * Updates a rabbit.
   *
   * @param currentUser - The current user details.
   * @param updateRabbitInput - The input data for updating the rabbit.
   * @returns A promise that resolves to the updated rabbit.
   * @throws {NotFoundException} if the rabbit with the provided ID is not found.
   * @throws {BadRequestException} if the provided data is invalid and cannot be updated.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager, Role.Volunteer)
  @Mutation(() => Rabbit)
  updateRabbit(
    @CurrentUser() currentUser: UserDetails,
    @Args('updateRabbitInput') updateRabbitInput: UpdateRabbitInput,
  ): Promise<Rabbit> {
    const isAdmin = currentUser.checkRole(Role.Admin);
    const regional = !isAdmin && currentUser.checkRole(Role.RegionManager);
    const volunteer = !isAdmin && !regional;

    return this.rabbitsService.update(
      updateRabbitInput.id,
      updateRabbitInput,
      isAdmin || regional,
      regional ? currentUser.managerRegions : undefined,
      volunteer ? [currentUser.teamId] : undefined,
    );
  }

  /**
   * Removes a rabbit with the specified ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the rabbit to remove.
   * @returns A promise that resolves to an EntityWithId object.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => EntityWithId)
  removeRabbit(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => ID }) idArg: string,
  ): Promise<EntityWithId> {
    const id = Number(idArg);

    return this.rabbitsService.remove(
      id,
      currentUser.checkRole(Role.Admin)
        ? undefined
        : currentUser.managerRegions,
    );
  }

  /**
   * Updates the rabbit group for a specific rabbit.
   *
   * @param currentUser - The current user details.
   * @param rabbitId - The ID of the rabbit to update.
   * @param rabbitGroupId - The ID of the new rabbit group. If not provided, new rabbit group will be created.
   * @returns A Promise that resolves to the updated rabbit.
   * @throws {NotFoundException} if the rabbit or rabbit group is not found.
   * @throws {BadRequestException} if the provided data is invalid.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => Rabbit, {
    name: 'updateRabbitRabbitGroup',
  })
  async updateRabbitGroup(
    @CurrentUser() currentUser: UserDetails,
    @Args('rabbitId', { type: () => ID }) rabbitIdArg: string,
    @Args('rabbitGroupId', { type: () => ID, nullable: true })
    rabbitGroupIdArg?: string,
  ): Promise<Rabbit> {
    const rabbitId = Number(rabbitIdArg);
    const rabbitGroupId = rabbitGroupIdArg
      ? Number(rabbitGroupIdArg)
      : undefined;

    return await this.rabbitsService.updateRabbitGroup(
      rabbitId,
      rabbitGroupId,
      currentUser.checkRole(Role.Admin)
        ? undefined
        : currentUser.managerRegions,
    );
  }
}
