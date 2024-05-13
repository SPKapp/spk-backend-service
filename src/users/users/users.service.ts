import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, In, Repository } from 'typeorm';

import { FirebaseAuthService } from '../../common/modules/auth';
import { TeamsService } from '../teams/teams.service';

import { User } from '../entities';
import {
  CreateUserInput,
  UpdateUserInput,
  FindAllUsersArgs,
  PaginatedUsers,
} from '../dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly teamsSerivce: TeamsService,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  /**
   * Creates a new user and register him in Firebase Auth
   *
   * @param createUserInput - The input data for creating a user.
   * @returns A promise that resolves to the created user.
   * @throws {ConflictException} If a user with the provided email or phone already exists.
   */
  async create(createUserInput: CreateUserInput): Promise<User> {
    await this.checkAvailability(createUserInput.email, createUserInput.phone);

    const firebaseUid = await this.firebaseAuthService.createUser(
      createUserInput.email,
      createUserInput.phone,
      `${createUserInput.firstname} ${createUserInput.lastname}`,
    );

    let user: User;
    try {
      user = await this.userRepository.save({
        ...createUserInput,
        firebaseUid: firebaseUid,
        active: true,
        region: { id: createUserInput.regionId },
      });

      await this.firebaseAuthService.setUserId(firebaseUid, user.id);
    } catch (e) {
      // Rollback Firebase user creation
      await this.firebaseAuthService.deleteUser(firebaseUid);
      throw e;
    }

    this.logger.log(`Created user ${user.email}`);
    return user;
  }

  /**
   * Retrieves a paginated list of users.
   *
   * @param args - The arguments for filtering and pagination.
   * @returns A promise that resolves to a `PaginatedUser` object containing the paginated user data.
   */
  async findAllPaginated(
    args: FindAllUsersArgs = {},
    totalCount: boolean,
  ): Promise<PaginatedUsers> {
    args.offset ??= 0;
    args.limit ??= 10;

    const options = this.createFilterOptions(args);

    return {
      data: await this.userRepository.find(options),
      offset: args.offset,
      limit: args.limit,
      totalCount: totalCount
        ? await this.userRepository.countBy(options.where)
        : undefined,
    };
  }

  /**
   * Retrieves all users based on the provided filters.
   *
   * @param args - The arguments for filtering and pagination.
   * @returns A promise that resolves to an array of User objects.
   */
  async findAll(args: FindAllUsersArgs = {}): Promise<User[]> {
    return await this.userRepository.find(this.createFilterOptions(args));
  }

  private createFilterOptions(
    args: FindAllUsersArgs = {},
  ): FindManyOptions<User> {
    return {
      skip: args.offset,
      take: args.limit,
      where: {
        region: { id: args.regionsIds ? In(args.regionsIds) : undefined },
        active: args.isActive,
        fullName: args.name ? ILike(`%${args.name}%`) : undefined,
      },
    };
  }

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user to find.
   * @param regionsIds - The IDs of the regions to filter by.
   * @returns A promise that resolves to the found user, or null if no user is found.
   */
  async findOne(id: number, regionsIds?: number[]): Promise<User | null> {
    return await this.userRepository.findOneBy({
      id,
      region: { id: regionsIds ? In(regionsIds) : undefined },
    });
  }

  /**
   * Finds a user by their UID.
   * @param id - The ID of the user to find.
   * @returns A promise that resolves to the found user, or null if no user is found.
   */
  async findOneByUid(uid: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ firebaseUid: uid });
  }

  /**
   * Updates a user with the provided id.
   * @param id - The id of the user to update.
   * @param updateUserInput - The updated user data.
   * @returns The updated user.
   * @throws {NotFoundException} if the user with the provided id does not exist.
   * @throws {ConflictException} If a user with the provided email or phone already exists.
   * @throws {BadRequestException} If the user cannot be removed because they are the last member of the team.
   * @throws {BadRequestException} if the team with the provided id does not exist.
   */
  async update(id: number, updateUserInput: UpdateUserInput): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User with the provided id does not exist.');
    }

    // await this.firebaseAuthService.addRegionManagerRole(user.firebaseUid, 1);
    // await this.firebaseAuthService.removeRegionManagerRole(user.firebaseUid);

    if (updateUserInput.email || updateUserInput.phone) {
      await this.checkAvailability(
        updateUserInput.email,
        updateUserInput.phone,
        id,
      );
    }

    if (updateUserInput.firstname) {
      user.firstname = updateUserInput.firstname;
    }
    if (updateUserInput.lastname) {
      user.lastname = updateUserInput.lastname;
    }
    if (updateUserInput.email) {
      // TODO: Add email sending
      user.email = updateUserInput.email;
    }
    if (updateUserInput.phone) {
      user.phone = updateUserInput.phone;
    }

    // if (updateUserInput.teamId) {
    //   const regionId = user.team.region.id;
    //   await this.leaveTeam(user);

    //   const team = await this.teamsSerivce.findOne(updateUserInput.teamId, [
    //     regionId,
    //   ]);
    //   if (!team) {
    //     throw new BadRequestException(
    //       'Team with the provided id does not exist.',
    //     );
    //   }
    //   user.team = team;
    // }

    if (updateUserInput.newTeam) {
      const regionId = user.team.region.id;
      // await this.leaveTeam(user);

      user.team = await this.teamsSerivce.create(regionId);
    }

    await this.userRepository.save(user);

    await this.firebaseAuthService.updateUser(
      user.firebaseUid,
      user.email,
      user.phone,
      `${user.firstname} ${user.lastname}`,
    );

    return user;
  }

  /**
   * Removes a user by their ID.
   * If the user is the last member of their team, the team will also be removed.
   * @param id - The ID of the user to be removed.
   * @returns The ID of the removed user.
   * @throws {BadRequestException} if the user cannot be removed.
   * @throws {NotFoundException} if the user with the provided ID does not exist.
   */
  async remove(id: number): Promise<number> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User with the provided id does not exist.');
    }

    // await this.leaveTeam(user);

    await this.firebaseAuthService.deleteUser(user.firebaseUid);

    await this.userRepository.remove(user);

    this.logger.log(`Removed user ${user.email}`);
    return id;
  }

  /**
   * Checks the availability of an email and phone number for a user.
   *
   * @param email - The email to check availability for.
   * @param phone - The phone number to check availability for.
   * @param id - (optional) The ID of the user to exclude from the check.
   * @throws {ConflictException} If a user with the provided email or phone already exists.
   */
  private async checkAvailability(
    email: string,
    phone: string,
    id?: number,
  ): Promise<void> {
    const existingUsers = await this.userRepository.find({
      select: ['id', 'email', 'phone'],
      where: [{ email }, { phone }],
    });

    if (existingUsers.some((user) => user.email === email && user.id !== id)) {
      throw new ConflictException(
        'User with the provided email already exists',
      );
    }
    if (existingUsers.some((user) => user.phone === phone && user.id !== id)) {
      throw new ConflictException(
        'User with the provided phone already exists',
      );
    }
  }
}
