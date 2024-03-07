import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseAuthService } from '../../common/modules/auth/firebase-auth/firebase-auth.service';
import { UsersService } from './users.service';
import { TeamsService } from '../teams/teams.service';
import { CreateUserInput } from '../dto/create-user.input';
import { User } from '../entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { Team } from '../entities/team.entity';

describe('UsersService', () => {
  let service: UsersService;
  let teamsService: TeamsService;
  let userRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: TeamsService,
          useValue: {
            create: jest.fn(
              async () =>
                new Team({
                  id: 1,
                }),
            ),
            findOne: jest.fn(async () => []),
            remove: jest.fn(),
          },
        },
        {
          provide: FirebaseAuthService,
          useValue: {
            createUser: jest.fn(async () => '123'),
            addRoleToUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
        {
          provide: 'UserRepository',
          useValue: {
            find: jest.fn(async () => []),
            findOneBy: jest.fn(),
            save: jest.fn(async (user) => ({ ...user, id: 1 })),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get('UserRepository');
    teamsService = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const user: CreateUserInput = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'email1@example.com',
      phone: '123456789',
      region_id: 1,
    };

    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should throw an error when user with the provided email already exists', async () => {
      jest
        .spyOn(userRepository, 'find')
        .mockImplementation(async () => [
          new User({ email: user.email, phone: '000000000' }),
        ]);

      await expect(service.create(user)).rejects.toThrow(
        new ConflictException('User with the provided email already exists'),
      );
    });

    it('should throw an error when user with the provided phone already exists', async () => {
      jest
        .spyOn(userRepository, 'find')
        .mockImplementation(async () => [
          new User({ email: 'different@example.com', phone: user.phone }),
        ]);

      await expect(service.create(user)).rejects.toThrow(
        new ConflictException('User with the provided phone already exists'),
      );
    });

    it('should throw an error when team with the provided id does not exist', async () => {
      jest.spyOn(teamsService, 'findOne').mockImplementation(async () => null);

      await expect(service.create({ ...user, team_id: 1 })).rejects.toThrow(
        new ConflictException('Team with the provided id does not exist'),
      );
    });

    it('should create user', async () => {
      const result = await service.create(user);
      expect(result).toEqual({
        ...user,
        id: 1,
        firebaseUid: '123',
        team: new Team({ id: 1 }),
      });
    });
  });
});

// TODO: Add tests
