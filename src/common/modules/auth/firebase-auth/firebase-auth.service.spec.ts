import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { Role } from '../auth.module';

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;
  let firebaseService: FirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthService,
        {
          provide: FirebaseService,
          useValue: {
            auth: {
              createUser: jest.fn(() => ({
                uid: '123',
              })),
              getUser: jest.fn(),
              setCustomUserClaims: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FirebaseAuthService>(FirebaseAuthService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should be defined', () => {
      expect(service.createUser).toBeDefined();
    });

    it('should create a user', async () => {
      await expect(
        service.createUser(
          'email@example.com',
          '123456789',
          'John Doe',
          'password',
        ),
      ).resolves.toEqual('123');
    });
  });

  describe('setUserId', () => {
    it('should be defined', () => {
      expect(service.setUserId).toBeDefined();
    });

    it('should set the user id', async () => {
      jest
        .spyOn(firebaseService.auth, 'getUser')
        .mockResolvedValue({ uid: '123' } as any);

      await service.setUserId('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          userId: 1,
        },
      );
    });

    it('should throw an error if the user already has an id', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: { userId: 1 },
      } as any);

      await expect(service.setUserId('123', 1)).rejects.toThrow(
        'User already has a userId',
      );
    });
  });

  describe('updateUser', () => {
    // TODO: Implement tests
  });

  describe('deleteUser', () => {
    // TODO: Implement tests
  });

  describe('addRoleToUser', () => {
    // TODO: Implement tests or remove
  });

  describe('removeRoleFromUser', () => {
    // TODO: Implement tests or remove
  });

  describe('addVolunteerRole', () => {
    it('should be defined', () => {
      expect(service.addVolunteerRole).toBeDefined();
    });

    it('should add the volunteer role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          should: 'not be removed',
        },
      } as any);

      await service.addVolunteerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          should: 'not be removed',
          roles: [Role.Volunteer],
          teamId: 1,
        },
      );
    });

    it('should change teamId if the user already has the volunteer role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.Volunteer],
          teamId: 2,
        },
      } as any);

      await service.addVolunteerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          roles: [Role.Volunteer],
          teamId: 1,
        },
      );
    });

    it('should add the volunteer role if the user has other roles', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.Admin],
        },
      } as any);

      await service.addVolunteerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          roles: [Role.Admin, Role.Volunteer],
          teamId: 1,
        },
      );
    });
  });

  describe('removeVolunteerRole', () => {
    it('should be defined', () => {
      expect(service.removeVolunteerRole).toBeDefined();
    });

    it('should remove the volunteer role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          should: 'not be removed',
          roles: [Role.Volunteer],
          teamId: 1,
        },
      } as any);

      await service.removeVolunteerRole('123');

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          should: 'not be removed',
          roles: [],
          teamId: undefined,
        },
      );
    });

    it('should remove the volunteer role if the user has other roles', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.Volunteer, Role.Admin],
          teamId: 1,
        },
      } as any);

      await service.removeVolunteerRole('123');

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          roles: [Role.Admin],
          teamId: undefined,
        },
      );
    });

    it('should do nothing if the user does not have the volunteer role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.Admin],
        },
      } as any);

      await service.removeVolunteerRole('123');

      expect(firebaseService.auth.setCustomUserClaims).not.toHaveBeenCalled();
    });

    it('should clear the teamId if the user does not have the volunteer role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.Admin],
          teamId: 1,
        },
      } as any);

      await service.removeVolunteerRole('123');

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          roles: [Role.Admin],
          teamId: undefined,
        },
      );
    });
  });

  describe('addRegionManagerRole', () => {
    it('should be defined', () => {
      expect(service.addRegionManagerRole).toBeDefined();
    });

    it('should add the region manager role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          should: 'not be removed',
        },
      } as any);

      await service.addRegionManagerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          should: 'not be removed',
          roles: [Role.RegionManager],
          managerRegions: [1],
        },
      );
    });

    it('should add regionId if the user already has the region manager role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.RegionManager],
          managerRegions: [2],
        },
      } as any);

      await service.addRegionManagerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          roles: [Role.RegionManager],
          managerRegions: [2, 1],
        },
      );
    });

    it('should add the region manager role if the user has other roles', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.Admin],
        },
      } as any);

      await service.addRegionManagerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          roles: [Role.Admin, Role.RegionManager],
          managerRegions: [1],
        },
      );
    });
  });

  describe('removeRegionManagerRole', () => {
    it('should be defined', () => {
      expect(service.removeRegionManagerRole).toBeDefined();
    });

    it('should remove the region manager role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          should: 'not be removed',
          roles: [Role.RegionManager],
          managerRegions: [1],
        },
      } as any);

      await service.removeRegionManagerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          should: 'not be removed',
          roles: [],
          managerRegions: undefined,
        },
      );
    });

    it('should remove the regionId if the user have other regions', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          should: 'not be removed',
          roles: [Role.RegionManager],
          managerRegions: [1, 2],
        },
      } as any);

      await service.removeRegionManagerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          should: 'not be removed',
          roles: [Role.RegionManager],
          managerRegions: [2],
        },
      );
    });

    it('should remove the region manager role if the user has other roles', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.RegionManager, Role.Admin],
          managerRegions: [1],
        },
      } as any);

      await service.removeRegionManagerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          roles: [Role.Admin],
          managerRegions: undefined,
        },
      );
    });

    it('should do nothing if the user does not have the region manager role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.Admin],
        },
      } as any);

      await service.removeRegionManagerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).not.toHaveBeenCalled();
    });

    it('should clear the regionId if the user does not have the region manager role', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        customClaims: {
          roles: [Role.Admin],
          managerRegions: [1],
        },
      } as any);

      await service.removeRegionManagerRole('123', 1);

      expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
        '123',
        {
          roles: [Role.Admin],
          managerRegions: undefined,
        },
      );
    });
  });
});
