import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { FirebaseAuthService } from '../../common/modules/auth/firebase-auth/firebase-auth.service';
import { TeamsService } from '../teams/teams.service';

import { Team } from '../entities/team.entity';
import { User } from '../entities/user.entity';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { Role } from '../../common/modules/auth/roles.eum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly teamsSerivce: TeamsService,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  /**
   * Creates a new user and register him in Firebase Auth
   * It also creates a new team for the user, if 'teamId' is not provided
   * Default role for the user is 'Role.Volunteer'
   *
   * @param createUserInput - The input data for creating a user.
   * @returns A promise that resolves to the created user.
   * @throws {ConflictException} If a user with the provided email or phone already exists.
   * @throws {BadRequestException} If the team with the provided id does not exist.
   */
  async create(createUserInput: CreateUserInput): Promise<User> {
    await this.checkAvailability(createUserInput.email, createUserInput.phone);

    let team: Team;
    if (!createUserInput.teamId) {
      team = await this.teamsSerivce.create(createUserInput.regionId);
    } else {
      team = await this.teamsSerivce.findOne(createUserInput.teamId, [
        createUserInput.regionId,
      ]);
      if (!team) {
        throw new BadRequestException(
          'Team with the provided id does not exist',
        );
      }
    }

    const password = randomBytes(8).toString('hex');

    const firebaseUid = await this.firebaseAuthService.createUser(
      createUserInput.email,
      createUserInput.phone,
      `${createUserInput.firstname} ${createUserInput.lastname}`,
      password,
    );
    await this.firebaseAuthService.addRoleToUser(firebaseUid, Role.Volunteer);

    let user: User;
    try {
      user = await this.userRepository.save(
        new User({
          ...createUserInput,
          firebaseUid: firebaseUid,
          team,
        }),
      );
    } catch (e) {
      this.logger.error(e);
      if (!createUserInput.teamId) {
        try {
          await this.teamsSerivce.remove(team.id);
        } finally {
        }
      }
      await this.firebaseAuthService.deleteUser(firebaseUid);
      throw e;
    }

    // TODO: Add email sending
    console.log(`User ${createUserInput.email} password: ${password}`);

    this.logger.log(`Created user ${user.email}`);
    return user;
  }

  /**
   * Finds all users.
   * @param regionsIds - (optional) The IDs of the regions to filter by.
   * @param teamsIds - (optional) The IDs of the teams to filter by.
   * @returns A promise that resolves to the found users.
   */
  async findAll(regionsIds?: number[]): Promise<User[]> {
    return await this.userRepository.findBy({
      team: {
        region: { id: regionsIds ? In(regionsIds) : undefined },
      },
    });
  }

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user to find.
   * @returns A promise that resolves to the found user, or null if no user is found.
   */
  async findOne(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
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

    if (updateUserInput.teamId) {
      const regionId = user.team.region.id;
      await this.leaveTeam(user);

      const team = await this.teamsSerivce.findOne(updateUserInput.teamId, [
        regionId,
      ]);
      if (!team) {
        throw new BadRequestException(
          'Team with the provided id does not exist.',
        );
      }
      user.team = team;
    }

    if (updateUserInput.newTeam) {
      const regionId = user.team.region.id;
      await this.leaveTeam(user);

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

    await this.leaveTeam(user);

    await this.firebaseAuthService.deleteUser(user.firebaseUid);

    await this.userRepository.remove(user);

    this.logger.log(`Removed user ${user.email}`);
    return id;
  }

  /**
   * Removes the user from their team.
   * If the user is the last member of the team, the team is also removed.
   *
   * @param user - The user to remove from the team.
   * @throws {BadRequestException} If the user cannot be removed because they are the last member of the team.
   */
  private async leaveTeam(user: User): Promise<void> {
    const team = user.team;

    if ((await team.users).length === 1) {
      if (!(await this.teamsSerivce.canRemove(user.team.id, user.id))) {
        throw new BadRequestException(
          'User cannot be removed. Last member of the team.',
        );
      }
      user.team = null;
      await this.userRepository.save(user);
      await this.teamsSerivce.remove(team.id);
    }
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
