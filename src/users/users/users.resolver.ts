import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

import { FirebaseAuth } from '../../common/modules/auth/firebase-auth/firebase-auth.decorator';
import { CurrentUser } from '../../common/modules/auth/current-user/current-user.decorator';
import { UserDetails } from '../../common/modules/auth/current-user/current-user';
import { UsersService } from './users.service';

import { User } from '../entities/user.entity';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { Role } from '../../common/modules/auth/roles.eum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EntityWithId } from '../../common/types/remove.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user.
   *
   * @param user - The current user details.
   * @param createUserInput - The input data for creating a user.
   * @returns A Promise that resolves to the created user.
   * @throws {BadRequestException} if the region ID is missing
   * @throws {ForbiddenException} if the region ID does not match the Region Manager permissions.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => User)
  async createUser(
    @CurrentUser() user: UserDetails,
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    if (
      (user.roles.includes(Role.Admin) || user.regions.length > 1) &&
      !createUserInput.region_id
    ) {
      throw new BadRequestException(
        'Region ID is required for Admin and Region Manager with more than 1 region.',
      );
    }

    if (
      !user.roles.includes(Role.Admin) &&
      user.roles.includes(Role.RegionManager)
    ) {
      if (!createUserInput.region_id) {
        createUserInput.region_id = user.regions[0];
      } else {
        if (!user.regions.includes(createUserInput.region_id)) {
          throw new ForbiddenException(
            'Region ID does not match the Region Manager permissions.',
          );
        }
      }
    }

    return await this.usersService.create(createUserInput);
  }

  // TODO: Implement this method
  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  // TODO: Implement this method
  @Query(() => User, { name: 'user' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return await this.usersService.findOne(id);
  }

  // TODO: Implement this method
  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  /**
   * Removes a user with the specified ID.
   *
   * @param user - The current user details.
   * @param id - The ID of the user to be removed.
   * @returns An object containing the ID of the removed user.
   * @throws {ForbiddenException} if the user region ID does not match the Region Manager permissions.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => EntityWithId)
  async removeUser(
    @CurrentUser() user: UserDetails,
    @Args('id', { type: () => Int }) id: number,
  ) {
    if (user.roles.includes(Role.RegionManager)) {
      const userToRemove = await this.usersService.findOne(id);
      if (!user.regions.includes(userToRemove.team.region.id)) {
        throw new ForbiddenException(
          'User does not belong to the Region Manager permissions.',
        );
      }
    }

    return { id: await this.usersService.remove(id) };
  }
}
