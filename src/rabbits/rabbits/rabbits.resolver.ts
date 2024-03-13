import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';

import {
  AuthService,
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth/auth.module';

import { RabbitsService } from './rabbits.service';
import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';

import { Rabbit } from '../entities/rabbit.entity';
import { CreateRabbitInput } from '../dto/create-rabbit.input';
import { UpdateRabbitInput } from '../dto/update-rabbit.input';

@Resolver(() => Rabbit)
export class RabbitsResolver {
  constructor(
    private readonly rabbitsService: RabbitsService,
    private readonly rabbitGroupsService: RabbitGroupsService,
    private readonly authService: AuthService,
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

    if (!currentUser.roles.includes(Role.Admin)) {
      await this.authService.checkRegionManagerPermissions(
        currentUser,
        async () => {
          if (createRabbitInput.rabbitGroupId) {
            const rabbitGroup = await this.rabbitGroupsService.findOne(
              createRabbitInput.rabbitGroupId,
            );
            if (!rabbitGroup) {
              throw new BadRequestException('Invalid rabbitGroupId');
            }
            return rabbitGroup.region.id;
          }
          return createRabbitInput.regionId;
        },
      );
    }

    return await this.rabbitsService.create(createRabbitInput);
  }

  @Query(() => [Rabbit], { name: 'rabbits' })
  findAll() {
    // TODO: Implement this method
    return this.rabbitsService.findAll();
  }

  @Query(() => Rabbit, { name: 'rabbit' })
  async findOne(@Args('id', { type: () => Int }) id: number): Promise<Rabbit> {
    // TODO: Implement this method
    return this.rabbitsService.findOne(id);
  }

  @Mutation(() => Rabbit)
  updateRabbit(
    @Args('updateRabbitInput') updateRabbitInput: UpdateRabbitInput,
  ) {
    // TODO: Implement this method
    return this.rabbitsService.update(updateRabbitInput.id, updateRabbitInput);
  }

  @Mutation(() => Rabbit)
  removeRabbit(@Args('id', { type: () => Int }) id: number) {
    // TODO: Implement this method
    return this.rabbitsService.remove(id);
  }
}
