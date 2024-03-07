import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { FirebaseAuthGuard } from '../../common/modules/auth/firebase-auth/firebase-auth.guard';
import { UserDetails } from '../../common/modules/auth/current-user/current-user';
import { Role } from '../../common/modules/auth/roles.eum';
import { Region } from '../../common/modules/region/entities/region.entity';

import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

import { CreateUserInput } from '../dto/create-user.input';
import { User } from '../entities/user.entity';
import { Team } from '../entities/team.entity';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: UsersService;

  const userDetailsTeplate: UserDetails = {
    uid: '123',
    email: 'email1@example.com',
    phone: '123456789',
    roles: [],
    regions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(() => 1),
          },
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createUser', () => {
    let createSpy: jest.SpyInstance;

    const user: CreateUserInput = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'email1@example.com',
      phone: '123456789',
    };

    beforeEach(() => {
      createSpy = jest
        .spyOn(usersService, 'create')
        .mockResolvedValue(new User(user));
    });

    it('should be defined', () => {
      expect(resolver.createUser).toBeDefined();
    });

    describe('Admin', () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      it('should throw no region_id error', async () => {
        await expect(
          resolver.createUser(userDetails, { ...user }),
        ).rejects.toThrow(
          new BadRequestException(
            'Region ID is required for Admin and Region Manager with more than 1 region.',
          ),
        );
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('should create user', async () => {
        const result = await resolver.createUser(userDetails, {
          ...user,
          region_id: 1,
        });
        expect(result).toEqual(new User(user));
        expect(createSpy).toHaveBeenCalled();
      });
    });

    describe('Region Manager', () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
      };

      it('should throw no region_id error', async () => {
        await expect(
          resolver.createUser({ ...userDetails, regions: [1, 2] }, { ...user }),
        ).rejects.toThrow(
          new BadRequestException(
            'Region ID is required for Admin and Region Manager with more than 1 region.',
          ),
        );
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('should throw wrong region_id error', async () => {
        await expect(
          resolver.createUser(
            { ...userDetails, regions: [2] },
            { ...user, region_id: 1 },
          ),
        ).rejects.toThrow(
          new ForbiddenException(
            'Region ID does not match the Region Manager permissions.',
          ),
        );
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('should create user - more than one region', async () => {
        const result = await resolver.createUser(
          { ...userDetails, regions: [1, 2] },
          {
            ...user,
            region_id: 1,
          },
        );
        expect(result).toEqual(new User(user));
        expect(createSpy).toHaveBeenCalled();
      });

      it('should create user - one region', async () => {
        console.log(user);
        const result = await resolver.createUser(
          { ...userDetails, regions: [2] },
          { ...user },
        );
        console.log(user, result);
        expect(result).toEqual(new User(user));
        expect(createSpy).toHaveBeenCalled();
      });
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(resolver.findAll).toBeDefined();
    });

    // TODO: Add tests
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    // TODO: Add tests
  });

  describe('updateUser', () => {
    it('should be defined', () => {
      expect(resolver.updateUser).toBeDefined();
    });

    // TODO: Add tests
  });

  describe('removeUser', () => {
    it('should be defined', () => {
      expect(resolver.removeUser).toBeDefined();
    });

    it('should throw bad permissions error', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [2],
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(
        new User({
          id: 1,
          team: new Team({
            id: 1,
            region: new Region({ id: 1 }),
          }),
        }),
      );

      await expect(resolver.removeUser(userDetails, 1)).rejects.toThrow(
        new ForbiddenException(
          'User does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should remove user', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      await expect(resolver.removeUser(userDetails, 1)).resolves.toEqual({
        id: 1,
      });
    });
  });
});