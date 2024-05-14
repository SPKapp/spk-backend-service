import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
  userRegionManager2Regions,
} from '../../common/tests/user-details.template';
import { FirebaseAuthGuard } from '../../common/modules/auth';

import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { PermissionsService } from '../permissions/permissions.service';

import { CreateUserInput } from '../dto';
import { User } from '../entities';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: PermissionsService,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneByUid: jest.fn(),
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
            "User doesn't have permissions to create user in this region.",
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
    const user = new User({ id: 1 });

    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    it('should throw not found error', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userRegionManager, '1')).rejects.toThrow(
        new NotFoundException('User with the provided ID does not exist.'),
      );

      expect(usersService.findOne).toHaveBeenCalledWith(1, [2]);
    });

    it('should find user', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(user);

      await expect(resolver.findOne(userAdmin, '1')).resolves.toEqual({
        id: 1,
      });

      expect(usersService.findOne).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('updateUser', () => {
    it('should be defined', () => {
      expect(resolver.updateUser).toBeDefined();
    });

    it('should update user', async () => {
      jest
        .spyOn(usersService, 'update')
        .mockResolvedValue(new User({ id: 1, firstname: 'John' }));

      await expect(
        resolver.updateUser(userAdmin, { id: 1, firstname: 'John' }),
      ).resolves.toEqual({ id: 1, firstname: 'John' });

      expect(usersService.update).toHaveBeenCalledWith(
        1,
        {
          id: 1,
          firstname: 'John',
        },
        undefined,
      );
    });
  });

  // describe('removeUser', () => {
  //   it('should be defined', () => {
  //     expect(resolver.removeUser).toBeDefined();
  //   });

  //   it('should throw bad permissions error', async () => {
  //     jest.spyOn(usersService, 'findOne').mockResolvedValue(
  //       new User({
  //         id: 1,
  //         team: new Team({
  //           id: 1,
  //           region: new Region({ id: 1 }),
  //         }),
  //       }),
  //     );

  //     await expect(resolver.removeUser(userRegionManager, '1')).rejects.toThrow(
  //       new ForbiddenException(
  //         'User does not belong to the Region Manager permissions.',
  //       ),
  //     );
  //   });

  //   it('should remove user', async () => {
  //     await expect(resolver.removeUser(userAdmin, '1')).resolves.toEqual({
  //       id: 1,
  //     });
  //   });
  // });

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
      const input = {
        firstname: 'Jake',
        lastname: 'Doe',
      };
      const user = new User({
        id: 1,
        firebaseUid: userAdmin.uid,
        firstname: 'John',
        lastname: 'Doe',
      });
      jest.spyOn(usersService, 'update').mockResolvedValue(user);

      await expect(resolver.updateMyProfile(userAdmin, input)).resolves.toEqual(
        user,
      );

      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        ...input,
        id: 1,
      });
    });
  });
});
