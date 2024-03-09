import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { FirebaseAuth } from '../../common/modules/auth/firebase-auth/firebase-auth.decorator';
import { AuthService } from '../../common/modules/auth/auth.service';
import { CurrentUser } from '../../common/modules/auth/current-user/current-user.decorator';
import { UserDetails } from '../../common/modules/auth/current-user/current-user';
import { UsersService } from './users.service';

import { User } from '../entities/user.entity';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { Role } from '../../common/modules/auth/roles.eum';
import { EntityWithId } from '../../common/types/remove.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

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
      !createUserInput.regionId
    ) {
      throw new BadRequestException(
        'Region ID is required for Admin and Region Manager with more than 1 region.',
      );
    }

    if (!user.roles.includes(Role.Admin)) {
      if (!createUserInput.regionId) {
        createUserInput.regionId = user.regions[0];
      } else {
        await this.authService.checkRegionManagerPermissions(
          user,
          async () => createUserInput.regionId,
        );
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

  /**
   * Updates a user.
   *
   * @param user - The current user details.
   * @param updateUserInput - The input data for updating the user.
   * @returns A Promise that resolves to the updated user.
   * @throws {ForbiddenException} if the user region ID does not match the Region Manager permissions.
   * @throws {NotFoundException} if the user with the provided id does not exist.
   * @throws {ConflictException} If a user with the provided email or phone already exists.
   * @throws {BadRequestException} If the user cannot be removed because they are the last member of the team.
   * @throws {BadRequestException} if the team with the provided id does not exist.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => User)
  async updateUser(
    @CurrentUser() user: UserDetails,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    await this.checkRegionManagerPermissions(user, updateUserInput.id);

    return await this.usersService.update(updateUserInput.id, updateUserInput);
  }

  /**
   * Removes a user with the specified ID.
   *
   * @param user - The current user details.
   * @param id - The ID of the user to be removed.
   * @returns An object containing the ID of the removed user.
   * @throws {ForbiddenException} if the user region ID does not match the Region Manager permissions.
   * @throws {BadRequestException} if the user cannot be removed.
   * @throws {NotFoundException} if the user with the provided ID does not exist.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => EntityWithId)
  async removeUser(
    @CurrentUser() user: UserDetails,
    @Args('id', { type: () => Int }) id: number,
  ) {
    await this.checkRegionManagerPermissions(user, id);

    return { id: await this.usersService.remove(id) };
  }

  /**
   * Checks if the current user has permissions to manage user with specyfied ID.
   * @param user - The Current user details.
   * @param userId - The ID of the user for manage.
   * @throws {ForbiddenException} if the user region ID does not match the Region Manager permissions.
   * @throws {NotFoundException} - If the user with the provided ID does not exist.
   */
  private async checkRegionManagerPermissions(
    user: UserDetails,
    userId: number,
  ) {
    if (!user.roles.includes(Role.Admin)) {
      await this.authService.checkRegionManagerPermissions(
        user,
        async () => {
          const userToRemove = await this.usersService.findOne(userId);
          if (!user) {
            throw new NotFoundException(
              'User with the provided id does not exist.',
            );
          }
          return userToRemove.team.region.id;
        },
        'User does not belong to the Region Manager permissions.',
      );
    }
  }
}
