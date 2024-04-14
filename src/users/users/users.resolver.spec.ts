import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
  userRegionManager2Regions,
} from '../../common/tests/user-details.template';
import {
  AuthService,
  FirebaseAuthGuard,
  getCurrentUserPipe,
} from '../../common/modules/auth/auth.module';

import { Region } from '../../common/modules/regions/entities/region.entity';

import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

import { CreateUserInput } from '../dto/create-user.input';
import { User } from '../entities/user.entity';
import { Team } from '../entities/team.entity';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneByUid: jest.fn(),
            update: jest.fn(() => ({ id: 1, firstname: 'John' })),
            remove: jest.fn(() => 1),
          },
        },
        AuthService,
      ],
    })
      .overridePipe(getCurrentUserPipe)
      .useValue({ transform: jest.fn((currentUser) => currentUser) })
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
      it('should throw no regionId error', async () => {
        await expect(
          resolver.createUser(userAdmin, { ...user }),
        ).rejects.toThrow(
          new BadRequestException(
            'Region ID is required for Admin and Region Manager with more than 1 region.',
          ),
        );
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('should create user', async () => {
        const result = await resolver.createUser(userAdmin, {
          ...user,
          regionId: 1,
        });
        expect(result).toEqual(new User(user));
        expect(createSpy).toHaveBeenCalled();
      });
    });

    describe('Region Manager', () => {
      it('should throw no regionId error', async () => {
        await expect(
          resolver.createUser(userRegionManager2Regions, { ...user }),
        ).rejects.toThrow(
          new BadRequestException(
            'Region ID is required for Admin and Region Manager with more than 1 region.',
          ),
        );
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('should throw wrong regionId error', async () => {
        await expect(
          resolver.createUser(userRegionManager, { ...user, regionId: 1 }),
        ).rejects.toThrow(
          new ForbiddenException(
            'Region ID does not match the Region Manager permissions.',
          ),
        );
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('should create user - more than one region', async () => {
        const result = await resolver.createUser(userRegionManager2Regions, {
          ...user,
          regionId: 1,
        });
        expect(result).toEqual(new User(user));
        expect(createSpy).toHaveBeenCalled();
      });

      it('should create user - one region', async () => {
        const result = await resolver.createUser(userRegionManager, {
          ...user,
        });
        expect(result).toEqual(new User(user));
        expect(createSpy).toHaveBeenCalled();
      });
    });
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    it('should throw bad permissions error', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(
        new User({
          id: 1,
          team: new Team({
            id: 1,
            region: new Region({ id: 1 }),
          }),
        }),
      );

      await expect(resolver.findOne(userRegionManager, 1)).rejects.toThrow(
        new ForbiddenException(
          'User does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should find user', async () => {
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(new User({ id: 1 }));

      await expect(resolver.findOne(userAdmin, 1)).resolves.toEqual({
        id: 1,
      });
    });
  });

  describe('updateUser', () => {
    it('should be defined', () => {
      expect(resolver.updateUser).toBeDefined();
    });

    it('should throw bad permissions error', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(
        new User({
          id: 1,
          team: new Team({
            id: 1,
            region: new Region({ id: 1 }),
          }),
        }),
      );

      await expect(
        resolver.updateUser(userRegionManager, { id: 1 }),
      ).rejects.toThrow(
        new ForbiddenException(
          'User does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should update user', async () => {
      await expect(
        resolver.updateUser(userAdmin, { id: 1, firstname: 'John' }),
      ).resolves.toEqual({ id: 1, firstname: 'John' });
    });
  });

  describe('removeUser', () => {
    it('should be defined', () => {
      expect(resolver.removeUser).toBeDefined();
    });

    it('should throw bad permissions error', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(
        new User({
          id: 1,
          team: new Team({
            id: 1,
            region: new Region({ id: 1 }),
          }),
        }),
      );

      await expect(resolver.removeUser(userRegionManager, 1)).rejects.toThrow(
        new ForbiddenException(
          'User does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should remove user', async () => {
      await expect(resolver.removeUser(userAdmin, 1)).resolves.toEqual({
        id: 1,
      });
    });
  });

  describe('myProfile', () => {
    it('should be defined', () => {
      expect(resolver.myProfile).toBeDefined();
    });

    it('should find my profile', async () => {
      jest
        .spyOn(usersService, 'findOneByUid')
        .mockResolvedValue(new User({ id: 1, firebaseUid: userAdmin.uid }));

      await expect(resolver.myProfile(userAdmin)).resolves.toEqual({
        id: 1,
        firebaseUid: userAdmin.uid,
      });
    });
  });

  describe('updateMyProfile', () => {
    it('should be defined', () => {
      expect(resolver.updateMyProfile).toBeDefined();
    });

    it('should update my profile', async () => {
      jest
        .spyOn(usersService, 'findOneByUid')
        .mockResolvedValue(
          new User({ id: 1, firebaseUid: userAdmin.uid, lastname: 'Doe' }),
        );
      const templateUser = {
        id: 1,
        firebaseUid: userAdmin.uid,
        lastname: 'Doe',
      };
      const user = {
        ...templateUser,
        firstname: 'John',
      };
      jest.spyOn(usersService, 'update').mockResolvedValue(new User(user));

      await expect(
        resolver.updateMyProfile(userAdmin, templateUser),
      ).resolves.toEqual(user);
    });
  });
});
