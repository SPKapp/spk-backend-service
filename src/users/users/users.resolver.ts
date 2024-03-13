import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  AuthService,
  FirebaseAuth,
  Role,
  CurrentUser,
  UserDetails,
} from '../../common/modules/auth/auth.module';

import { EntityWithId } from '../../common/types/remove.entity';

import { UsersService } from './users.service';

import { User } from '../entities/user.entity';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { UpdateProfileInput } from '../dto/update-profile.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Creates a new user.
   *
   * @param currentUser - The current user details.
   * @param createUserInput - The input data for creating a user.
   * @returns A Promise that resolves to the created user.
   * @throws {BadRequestException} if the region ID is missing
   * @throws {ForbiddenException} if the region ID does not match the Region Manager permissions.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => User)
  async createUser(
    @CurrentUser() currentUser: UserDetails,
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    if (
      (currentUser.roles.includes(Role.Admin) ||
        currentUser.regions.length > 1) &&
      !createUserInput.regionId
    ) {
      throw new BadRequestException(
        'Region ID is required for Admin and Region Manager with more than 1 region.',
      );
    }

    if (!currentUser.roles.includes(Role.Admin)) {
      if (!createUserInput.regionId) {
        createUserInput.regionId = currentUser.regions[0];
      } else {
        await this.authService.checkRegionManagerPermissions(
          currentUser,
          async () => createUserInput.regionId,
        );
      }
    }

    return await this.usersService.create(createUserInput);
  }

  /**
   * Finds a user by their ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the user to find.
   * @returns A promise that resolves to the found user.
   * @throws {ForbiddenException} if the user region ID does not match the Region Manager permissions.
   * @throws {NotFoundException} - If the user with the provided ID does not exist.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Query(() => User, { name: 'user' })
  async findOne(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => Int }) id: number,
  ) {
    await this.checkRegionManagerPermissions(currentUser, id);

    const foundUser = await this.usersService.findOne(id);
    if (!foundUser) {
      throw new NotFoundException('User with the provided id does not exist.');
    }
    return foundUser;
  }

  /**
   * Updates a user.
   *
   * @param currentUser - The current user details.
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
    @CurrentUser() currentUser: UserDetails,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    await this.checkRegionManagerPermissions(currentUser, updateUserInput.id);

    return await this.usersService.update(updateUserInput.id, updateUserInput);
  }

  /**
   * Removes a user with the specified ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the user to be removed.
   * @returns An object containing the ID of the removed user.
   * @throws {ForbiddenException} if the user region ID does not match the Region Manager permissions.
   * @throws {BadRequestException} if the user cannot be removed.
   * @throws {NotFoundException} if the user with the provided ID does not exist.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => EntityWithId)
  async removeUser(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => Int }) id: number,
  ) {
    await this.checkRegionManagerPermissions(currentUser, id);

    return { id: await this.usersService.remove(id) };
  }

  /**
   * Retrieves the profile of the currently authenticated user.
   *
   * @param currentUser - The details of the currently authenticated user.
   * @returns A Promise that resolves to the user's profile.
   */
  @FirebaseAuth()
  @Query(() => User)
  async myProfile(@CurrentUser() currentUser: UserDetails): Promise<User> {
    return await this.usersService.findOneByUid(currentUser.uid);
  }

  /**
   * Updates the profile of the currently authenticated user.
   *
   * @param currentUser - The currently authenticated user.
   * @param updateProfileInput - The input data for updating the user's profile.
   * @returns The updated user profile.
   */
  @FirebaseAuth()
  @Mutation(() => User)
  async updateMyProfile(
    @CurrentUser() currentUser: UserDetails,
    @Args('updateUserInput') updateProfileInput: UpdateProfileInput,
  ): Promise<User> {
    const userToUpdate = await this.usersService.findOneByUid(currentUser.uid);

    return await this.usersService.update(userToUpdate.id, {
      ...updateProfileInput,
      id: userToUpdate.id,
    });
  }

  /**
   * Checks if the current user has permissions to manage user with specyfied ID.
   * @param user - The Current user details.
   * @param userId - The ID of the user for manage.
   * @throws {ForbiddenException} if the user region ID does not match the Region Manager permissions.
   */
  private async checkRegionManagerPermissions(
    user: UserDetails,
    userId: number,
  ) {
    if (!user.roles.includes(Role.Admin)) {
      await this.authService.checkRegionManagerPermissions(
        user,
        async () => {
          const userToCheck = await this.usersService.findOne(userId);
          if (!user) {
            throw new ForbiddenException(
              'User does not belong to the Region Manager permissions.',
            );
          }
          return userToCheck.team.region.id;
        },
        'User does not belong to the Region Manager permissions.',
      );
    }
  }
}
