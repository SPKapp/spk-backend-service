import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   * It also creates a new team for the user, if 'team_id' is not provided
   * Default role for the user is 'Role.Volunteer'
   *
   * @param createUserInput - The input data for creating a user.
   * @returns A promise that resolves to the created user.
   * @throws {ConflictException} If a user with the provided email or phone already exists.
   * @throws {BadRequestException} If the team with the provided id does not exist.
   */
  async create(createUserInput: CreateUserInput): Promise<User> {
    if (!createUserInput.phone.startsWith('+48')) {
      createUserInput.phone = `+48${createUserInput.phone}`;
    }

    const existingUsers = await this.userRepository.find({
      select: ['email', 'phone'],
      where: [
        { email: createUserInput.email },
        { phone: createUserInput.phone },
      ],
    });
    if (existingUsers.some((user) => user.email === createUserInput.email)) {
      throw new ConflictException(
        'User with the provided email already exists',
      );
    }
    if (existingUsers.some((user) => user.phone === createUserInput.phone)) {
      throw new ConflictException(
        'User with the provided phone already exists',
      );
    }

    let team: Team;
    if (!createUserInput.team_id) {
      team = await this.teamsSerivce.create(createUserInput.region_id);
    } else {
      team = await this.teamsSerivce.findOne(createUserInput.team_id, [
        createUserInput.region_id,
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
      if (!createUserInput.team_id) {
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

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    return await this.userRepository.findOneBy({ id });
  }

  update(id: number, updateUserInput: UpdateUserInput) {
    return `This action updates a #${id} user with ${JSON.stringify(updateUserInput)}`;
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

    try {
      await this.firebaseAuthService.deleteUser(user.firebaseUid);
    } catch (e) {
      this.logger.error(`FirebaseError: ${e}`);
    }

    await this.userRepository.remove(user);

    this.logger.log(`Removed user ${user.email}`);
    return id;
  }
}
