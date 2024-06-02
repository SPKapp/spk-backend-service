import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { FirebaseAuthService } from '../../common/modules/auth';

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
    readonly userRepository: Repository<User>,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  /**
   * Creates a new user and register him in Firebase Auth
   *
   * @param createUserInput - The input data for creating a user.
   * @returns A promise that resolves to the created user.
   * @throws {ConflictException} - `email-exists` If a user with the provided email already exists.
   * @throws {ConflictException} - `phone-exists` If a user with the provided phone already exists.
   */
  @Transactional()
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
   * @throws {NotFoundException} - `user-not-found` if the user with the provided id does not exist.
   * @throws {ConflictException} - `email-exists` If a user with the provided email already exists.
   * @throws {ConflictException} - `phone-exists` If a user with the provided phone already exists.
   */
  @Transactional()
  async update(
    id: number,
    updateUserInput: UpdateUserInput,
    regionsIds?: number[],
  ): Promise<User> {
    const user = await this.userRepository.findOneBy({
      id,
      region: { id: regionsIds ? In(regionsIds) : undefined },
    });
    if (!user) {
      throw new NotFoundException(
        'User with the provided id does not exist.',
        'user-not-found',
      );
    }

    if (updateUserInput.email || updateUserInput.phone) {
      await this.checkAvailability(
        updateUserInput.email,
        updateUserInput.phone,
        id,
      );
    }

    user.firstname = updateUserInput.firstname ?? user.firstname;
    user.lastname = updateUserInput.lastname ?? user.lastname;
    user.email = updateUserInput.email ?? user.email;
    user.phone = updateUserInput.phone ?? user.phone;

    await this.userRepository.save(user);

    // We don't need to handle errors here
    // @Transactional will rollback the transaction automagically
    await this.firebaseAuthService.updateUser(
      user.firebaseUid,
      updateUserInput.email,
      updateUserInput.phone,
      `${user.firstname} ${user.lastname}`,
    );

    return user;
  }

  /**
   * Removes a user by their ID.
   * If the user is the last member of their team, the team will also be removed.
   * @param id - The ID of the user to be removed.
   * @param regionsIds - The IDs of the regions to filter by.
   * @returns The ID of the removed user.
   * @throws {NotFoundException} `user-not-found` if the user with the provided ID does not exist.
   * @throws {ConflictException} `user-active` if the user is active.
   *
   */
  @Transactional()
  async remove(id: number, regionsIds?: number[]): Promise<number> {
    const user = await this.userRepository.findOne({
      relations: {
        fcmTokens: true,
        roles: true,
      },
      where: { id, region: { id: regionsIds ? In(regionsIds) : undefined } },
    });
    if (!user) {
      throw new NotFoundException(
        'User with the provided id does not exist.',
        'user-not-found',
      );
    }

    // In this way we avoid removing users with any active relation (e.g. active RabbitGroups)
    if (user.active) {
      throw new ConflictException(
        'Can remove only inactive users',
        'user-active',
      );
    }

    try {
      await this.firebaseAuthService.deleteUser(user.firebaseUid);
    } catch (e) {
      this.logger.error(`Failed to remove user ${user.email} from Firebase.`);
      throw new InternalServerErrorException(
        'Failed to remove user from Firebase',
      );
    }

    // remove sensitive data, but keep the record for history purposes
    user.firstname = 'Deleted';
    user.lastname = 'Deleted';
    user.firebaseUid = `Deleted-${user.id}`;
    user.email = `Deleted-${user.id}`;
    user.phone = `Deleted-${user.id}`;

    await this.userRepository.save(user);
    await this.userRepository.softRemove(user);

    this.logger.log(`Removed user ${user.id}`);
    return id;
  }

  /**
   * Checks the availability of an email and phone number for a user.
   *
   * @param email - The email to check availability for.
   * @param phone - The phone number to check availability for.
   * @param id - (optional) The ID of the user to exclude from the check.
   * @throws {ConflictException} - `email-exists` If a user with the provided email already exists.
   * @throws {ConflictException} - `phone-exists` If a user with the provided phone already exists.
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
        'email-exists',
      );
    }
    if (existingUsers.some((user) => user.phone === phone && user.id !== id)) {
      throw new ConflictException(
        'User with the provided phone already exists',
        'phone-exists',
      );
    }
  }
}
