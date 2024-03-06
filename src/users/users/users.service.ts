import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { FirebaseService } from '../../common/modules/firebase/firebase.service';

import { User } from '../entities/user.entity';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly firebaseService: FirebaseService,
  ) {}

  /*
   * This method creates a new user, and register it in Firebase Auth
   * It also creates a new team for the user, if 'team_id' is not provided
   * Default role for the user is ''// TODO: Add default role here
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
        }),
      );
    } catch (e) {
      await this.userRepository.delete({ email: createUserInput.email });
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
