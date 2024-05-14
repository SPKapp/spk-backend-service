import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ILike, In, Repository } from 'typeorm';

import { FirebaseAuthService } from '../../common/modules/auth';
import { UsersService } from './users.service';
import { TeamsService } from '../teams/teams.service';

import { CreateUserInput } from '../dto';
import { User, Team } from '../entities';
import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let firebaseAuthService: FirebaseAuthService;
  let userRepository: Repository<User>;

  const userInput: CreateUserInput = {
    firstname: 'John',
    lastname: 'Doe',
    email: 'email1@example.com',
    phone: '123456789',
    regionId: 1,
  };
  const user = new User({
    id: 1,
    firebaseUid: '123',
    ...userInput,
  });
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
          provide: getRepositoryToken(User),
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
    firebaseAuthService = module.get<FirebaseAuthService>(FirebaseAuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
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
          new User({ id: 1, email: userInput.email, phone: '000000000' }),
        ]);

      await expect(service.create(userInput)).rejects.toThrow(
        new ConflictException('User with the provided email already exists'),
      );
    });

    it('should throw an error when user with the provided phone already exists', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValue([
        new User({
          id: 1,
          email: 'different@example.com',
          phone: userInput.phone,
        }),
      ]);

      await expect(service.create(userInput)).rejects.toThrow(
        new ConflictException('User with the provided phone already exists'),
      );
    });

    it('should create user', async () => {
      await expect(service.create(userInput)).resolves.toEqual({
        ...userInput,
        id: 1,
        firebaseUid: '123',
        region: { id: 1 },
        active: true,
      });

      expect(userRepository.save).toHaveBeenCalled();

      expect(firebaseAuthService.createUser).toHaveBeenCalledWith(
        userInput.email,
        userInput.phone,
        'John Doe',
      );

      expect(firebaseAuthService.setUserId).toHaveBeenCalledWith('123', 1);
    });

    it('should rollback firebase user creation', async () => {
      jest.spyOn(userRepository, 'save').mockRejectedValue(new Error());
      jest.spyOn(firebaseAuthService, 'deleteUser').mockResolvedValue();

      await expect(service.create(userInput)).rejects.toThrow();

      expect(firebaseAuthService.deleteUser).toHaveBeenCalledWith('123');
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
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(user);

      await expect(service.findOne(1)).resolves.toEqual(user);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        region: { id: undefined },
      });
    });

    it('should return null', async () => {
      await expect(service.findOne(1)).resolves.toBeNull();
    });

    it('should return user by regionsIds', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(user);

      await expect(service.findOne(1, [1])).resolves.toEqual(user);

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
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(user);

      const result = await service.findOneByUid('123');
      expect(result).toEqual(user);
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
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(user);
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

    it('should throw an error when user with the provided phone already exists', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(user);
      jest
        .spyOn(userRepository, 'find')
        .mockResolvedValue([
          new User({ id: 2, email: 'new@example.com', phone: '+48000000000' }),
        ]);

      await expect(
        service.update(1, {
          id: 1,
          phone: '+48000000000',
        }),
      ).rejects.toThrow(
        new ConflictException('User with the provided phone already exists'),
      );
    });

    it('should update user', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(user);

      await expect(
        service.update(1, {
          id: 1,
          firstname: 'Jane',
          lastname: 'Doe',
          email: 'new@example.com',
        }),
      ).resolves.toEqual({
        ...user,
        firstname: 'Jane',
        lastname: 'Doe',
        email: 'new@example.com',
      });

      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        firstname: 'Jane',
        lastname: 'Doe',
        email: 'new@example.com',
      });
      expect(firebaseAuthService.updateUser).toHaveBeenCalledWith(
        user.firebaseUid,
        'new@example.com',
        undefined,
        'Jane Doe',
      );
    });
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
          ...userInput,
          team: new Team({
            id: 1,
            users: new Promise((res) => res([new User(userInput)])),
          }),
        }),
      );

      await expect(service.remove(1)).resolves.toBe(1);
    });

    it('should remove user', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
        new User({
          ...userInput,
          team: new Team({
            id: 1,
            users: new Promise((res) =>
              res([new User(userInput), new User(userInput)]),
            ),
          }),
        }),
      );

      await expect(service.remove(1)).resolves.toBe(1);
    });
  });
});
