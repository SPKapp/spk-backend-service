import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  ID,
} from '@nestjs/graphql';
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

import { EntityWithId } from '../../common/types/remove.entity';

import { UsersService } from './users.service';
import { PermissionsService } from '../permissions/permissions.service';

import { RoleEntity, User } from '../entities';
import { CreateUserInput, UpdateUserInput, UpdateProfileInput } from '../dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
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
    const isAdmin = currentUser.checkRole(Role.Admin);

    if (
      (isAdmin || currentUser.managerRegions.length > 1) &&
      !createUserInput.regionId
    ) {
      throw new BadRequestException(
        'Region ID is required for Admin and Region Manager with more than 1 region.',
      );
    }

    if (!isAdmin) {
      if (!createUserInput.regionId) {
        createUserInput.regionId = currentUser.managerRegions[0];
      } else if (!currentUser.checkRegionManager(createUserInput.regionId)) {
        throw new ForbiddenException(
          "User doesn't have permissions to create user in this region.",
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
    @Args('id', { type: () => ID }) idArg: string,
  ) {
    const id = Number(idArg);
    let regionsIds: number[];

    if (!currentUser.checkRole(Role.Admin)) {
      regionsIds = currentUser.managerRegions;
    }

    const result = await this.usersService.findOne(id, regionsIds);
    if (!result) {
      throw new NotFoundException('User with the provided ID does not exist.');
    }
    return result;
  }

  /**
   * Updates a user.
   *
   * @param currentUser - The current user details.
   * @param updateUserInput - The input data for updating the user.
   * @returns A Promise that resolves to the updated user.
   * @throws {NotFoundException} if the user with the provided id does not exist.
   * @throws {ConflictException} If a user with the provided email or phone already exists.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => User)
  async updateUser(
    @CurrentUser() currentUser: UserDetails,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    return await this.usersService.update(
      updateUserInput.id,
      updateUserInput,
      currentUser.checkRole(Role.Admin)
        ? undefined
        : currentUser.managerRegions,
    );
  }

  /**
   * Removes a user with the specified ID.
   *
   * @param currentUser - The current user details.
   * @param id - The ID of the user to be removed.
   * @returns An object containing the ID of the removed user.
   * @throws {NotFoundException} - `user-not-found` if the user with the provided ID does not exist.
   *  or currentUser not have permissions to remove the user.
   * @throws  {ConflictException} `user-active` if the user is active.
   */
  @FirebaseAuth(Role.Admin, Role.RegionManager)
  @Mutation(() => EntityWithId)
  async removeUser(
    @CurrentUser() currentUser: UserDetails,
    @Args('id', { type: () => ID }) idArg: string,
  ) {
    const id = Number(idArg);

    return {
      id: await this.usersService.remove(
        id,
        currentUser.checkRole(Role.Admin)
          ? undefined
          : currentUser.managerRegions,
      ),
    };
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
    return await this.usersService.update(currentUser.id, {
      ...updateProfileInput,
      id: currentUser.id,
    });
  }

  @ResolveField(() => [Role], {
    description: 'The roles of the user without additional info like region.',
    name: 'roles',
  })
  async roles(@Parent() parent: User): Promise<Role[]> {
    return [...new Set((await parent.roles).map((role) => role.role))];
  }

  @ResolveField(() => [RoleEntity], {
    description:
      'The roles of the user with additional info like region or team.',
    name: 'rolesWithDetails',
  })
  async rolesWithDetails(@Parent() parent: User): Promise<RoleEntity[]> {
    return await parent.roles;
  }
}
