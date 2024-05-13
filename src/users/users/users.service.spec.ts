import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ILike, In } from 'typeorm';

import { FirebaseAuthService } from '../../common/modules/auth';
import { UsersService } from './users.service';
import { TeamsService } from '../teams/teams.service';

import { CreateUserInput } from '../dto';
import { User, Team } from '../entities';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  // let teamsService: TeamsService;
  let userRepository: any;

  const user: CreateUserInput = {
    firstname: 'John',
    lastname: 'Doe',
    email: 'email1@example.com',
    phone: '123456789',
    regionId: 1,
  };
  const users = [new User({ id: 1 }), new User({ id: 2 })];

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
            canRemove: jest.fn(async () => true),
          },
        },
        {
          provide: FirebaseAuthService,
          useValue: {
            createUser: jest.fn(async () => '123'),
            setUserId: jest.fn(),
            addRoleToUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
        {
          provide: 'UserRepository',
          useValue: {
            find: jest.fn(async () => []),
            findBy: jest.fn(async () => []),
            findOneBy: jest.fn(async () => null),
            save: jest.fn(async (user) => ({ ...user, id: 1 })),
            remove: jest.fn(),
            countBy: jest.fn(async () => 2),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get('UserRepository');
    // teamsService = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should throw an error when user with the provided email already exists', async () => {
      jest
        .spyOn(userRepository, 'find')
        .mockResolvedValue([
          new User({ id: 1, email: user.email, phone: '000000000' }),
        ]);

      await expect(service.create(user)).rejects.toThrow(
        new ConflictException('User with the provided email already exists'),
      );
    });

    it('should throw an error when user with the provided phone already exists', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValue([
        new User({
          id: 1,
          email: 'different@example.com',
          phone: user.phone,
        }),
      ]);

      await expect(service.create(user)).rejects.toThrow(
        new ConflictException('User with the provided phone already exists'),
      );
    });

    it('should create user', async () => {
      const result = await service.create(user);
      expect(result).toEqual({
        ...user,
        id: 1,
        firebaseUid: '123',
        region: { id: 1 },
        active: true,
      });
    });
  });

  describe('findAllPaginated', () => {
    beforeEach(() => {
      jest.spyOn(userRepository, 'find').mockResolvedValue(users);
      jest.spyOn(userRepository, 'countBy').mockResolvedValue(users.length);
    });

    it('should be defined', () => {
      expect(service.findAllPaginated).toBeDefined();
    });

    it('should return all users paginated', async () => {
      await expect(service.findAllPaginated({}, false)).resolves.toEqual({
        data: users,
        offset: 0,
        limit: 10,
      });

      expect(userRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          region: { id: undefined },
          active: undefined,
          fullName: undefined,
        },
      });
      expect(userRepository.countBy).not.toHaveBeenCalled();
    });

    it('should return users with totalCount', async () => {
      await expect(
        service.findAllPaginated(
          {
            regionsIds: [1],
            offset: 10,
            limit: 20,
          },
          true,
        ),
      ).resolves.toEqual({
        data: users,
        offset: 10,
        limit: 20,
        totalCount: 2,
      });

      expect(userRepository.find).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        where: {
          region: { id: In([1]) },
        },
      });
      expect(userRepository.countBy).toHaveBeenCalledWith({
        region: { id: In([1]) },
      });
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should return all users', async () => {
      const users = [new User({ id: 1 }), new User({ id: 2 })];
      jest.spyOn(userRepository, 'find').mockResolvedValue(users);

      await expect(service.findAll()).resolves.toEqual(users);

      expect(userRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          region: { id: undefined },
        },
      });
    });

    it('should return users by regionsIds', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValue(users);

      await expect(
        service.findAll({
          regionsIds: [1],
          offset: 10,
          limit: 20,
        }),
      ).resolves.toEqual(users);

      expect(userRepository.find).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        where: {
          region: { id: In([1]) },
        },
      });
    });

    it('should return users by isActive', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValue(users);

      await expect(
        service.findAll({
          isActive: true,
        }),
      ).resolves.toEqual(users);

      expect(userRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          region: { id: undefined },
          active: true,
        },
      });
    });

    it('should return users by name', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValue(users);

      await expect(
        service.findAll({
          name: 'John',
        }),
      ).resolves.toEqual(users);

      expect(userRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          region: { id: undefined },
          active: undefined,
          fullName: ILike('%John%'),
        },
      });
    });
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should return user', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue({
        id: 1,
        ...user,
      });

      await expect(service.findOne(1)).resolves.toEqual({
        id: 1,
        ...user,
      });

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        region: { id: undefined },
      });
    });

    it('should return null', async () => {
      await expect(service.findOne(1)).resolves.toBeNull();
    });

    it('should return user by regionsIds', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue({
        id: 1,
        ...user,
      });

      await expect(service.findOne(1, [1])).resolves.toEqual({
        id: 1,
        ...user,
      });

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        region: { id: In([1]) },
      });
    });
  });

  describe('findOneByUid', () => {
    it('should be defined', () => {
      expect(service.findOneByUid).toBeDefined();
    });

    it('should return user', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue({
        id: 1,
        firebaseUid: '123',
        ...user,
      });

      const result = await service.findOneByUid('123');
      expect(result).toEqual({
        id: 1,
        firebaseUid: '123',
        ...user,
      });
    });

    it('should return null', async () => {
      const result = await service.findOneByUid('123');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should be defined', () => {
      expect(service.update).toBeDefined();
    });

    it('should throw user not found error', async () => {
      await expect(service.update(1, { id: 1 })).rejects.toThrow(
        new NotFoundException('User with the provided id does not exist.'),
      );
    });

    it('should throw an error when user with the provided email already exists', async () => {
      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValue(new User({ id: 1, ...user }));
      jest
        .spyOn(userRepository, 'find')
        .mockResolvedValue([
          new User({ id: 2, email: 'new@example.com', phone: '+48000000000' }),
        ]);

      await expect(
        service.update(1, {
          id: 1,
          email: 'new@example.com',
        }),
      ).rejects.toThrow(
        new ConflictException('User with the provided email already exists'),
      );
    });

    // it('should throw an error when team with the provided id does not exist', async () => {
    //   jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
    //     new User({
    //       id: 1,
    //       ...user,
    //       team: new Team({
    //         id: 1,
    //         region: new Region({ id: 1 }),
    //         users: new Promise((res) => res([new User()])),
    //       }),
    //     }),
    //   );

    //   jest.spyOn(teamsService, 'findOne').mockResolvedValue(null);
    //   await expect(service.update(1, { id: 1, teamId: 1 })).rejects.toThrow(
    //     new BadRequestException('Team with the provided id does not exist.'),
    //   );
    // });

    // it('should update user', async () => {
    //   jest.spyOn(userRepository, 'findOneBy').mockResolvedValue({
    //     id: 1,
    //     ...user,
    //     team: new Team({
    //       id: 1,
    //       region: new Region({ id: 1 }),
    //       users: new Promise((res) => res([new User()])),
    //     }),
    //   });

    //   jest
    //     .spyOn(teamsService, 'findOne')
    //     .mockResolvedValue(new Team({ id: 2 }));

    //   const newUserData = {
    //     id: 1,
    //     firstname: 'Ed',
    //     lastname: 'Ward',
    //     email: 'new@example.com',
    //     phone: '+48000000000',
    //   };
    //   const result = await service.update(1, { ...newUserData, teamId: 2 });

    //   expect(result).toEqual({
    //     ...user,
    //     ...newUserData,
    //     team: new Team({ id: 2 }),
    //   });
    // });
  });

  describe('remove', () => {
    it('should be defined', () => {
      expect(service.remove).toBeDefined();
    });

    it('should throw user not found error', async () => {
      await expect(service.remove(1)).rejects.toThrow(
        new NotFoundException('User with the provided id does not exist.'),
      );
    });

    // it('should throw last member of the team error', async () => {
    //   // jest.spyOn(teamsService, 'canRemove').mockResolvedValue(false);
    //   jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
    //     new User({
    //       ...user,
    //       team: new Team({
    //         id: 1,
    //         users: new Promise((res) => res([new User(user)])),
    //       }),
    //     }),
    //   );

    //   await expect(service.remove(1)).rejects.toThrow(
    //     new BadRequestException(
    //       'User cannot be removed. Last member of the team.',
    //     ),
    //   );
    // });

    it('should remove user, when is last in a team', async () => {
      // jest.spyOn(teamsService, 'canRemove').mockResolvedValue(true);
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
        new User({
          ...user,
          team: new Team({
            id: 1,
            users: new Promise((res) => res([new User(user)])),
          }),
        }),
      );

      await expect(service.remove(1)).resolves.toBe(1);
    });

    it('should remove user', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
        new User({
          ...user,
          team: new Team({
            id: 1,
            users: new Promise((res) => res([new User(user), new User(user)])),
          }),
        }),
      );

      await expect(service.remove(1)).resolves.toBe(1);
    });
  });
});
