import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { FirebaseService } from '../../common/modules/firebase/firebase.service';
import { TeamsService } from '../teams/teams.service';

import { Team } from '../entities/team.entity';
import { User } from '../entities/user.entity';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly teamsSerivce: TeamsService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Creates a new user and register him in Firebase Auth
   * It also creates a new team for the user, if 'team_id' is not provided
   * Default role for the user is ''// TODO: Add default role here
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
      team = await this.teamsSerivce.findOne(createUserInput.team_id);
      if (!team) {
        throw new BadRequestException(
          'Team with the provided id does not exist',
        );
      }
    }

    const password = randomBytes(8).toString('hex');

    const firebaseUser = await this.firebaseService.auth.createUser({
      email: createUserInput.email,
      phoneNumber: createUserInput.phone,
      displayName: `${createUserInput.firstname} ${createUserInput.lastname}`,
      password: password,
    });
    // TODO: Add default role here

    // TODO: Add email sending
    console.log(`User ${createUserInput.email} password: ${password}`);

    try {
      return await this.userRepository.save(
        new User({
          ...createUserInput,
          firebaseUid: firebaseUser.uid,
          team,
        }),
      );
    } catch (e) {
      if (!createUserInput.team_id) {
        try {
          await this.teamsSerivce.remove(team.id);
        } finally {
        }
      }
      await this.firebaseService.auth.deleteUser(firebaseUser.uid);
      throw e;
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserInput: UpdateUserInput) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
