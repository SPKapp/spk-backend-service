import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { Role } from '../roles.eum';
import { AuthConfig, CommonConfig } from '../../../../config';

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;
  let firebaseService: FirebaseService;
  let mailService: MailerService;

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
              updateUser: jest.fn(),
              generatePasswordResetLink: jest.fn(() => 'http://link'),
              generateVerifyAndChangeEmailLink: jest.fn(() => 'http://link'),
              setCustomUserClaims: jest.fn(),
              deleteUser: jest.fn(),
            },
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: CommonConfig.KEY,
          useValue: {
            appName: 'Test App',
          },
        },
        {
          provide: AuthConfig.KEY,
          useValue: {
            actionCodeSettings: {
              url: 'http://link',
            },
          },
        },
      ],
    }).compile();

    service = module.get<FirebaseAuthService>(FirebaseAuthService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
    mailService = module.get<MailerService>(MailerService);
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
        service.createUser('email@example.com', '123456789', 'John Doe'),
      ).resolves.toEqual('123');
    });

    it('should throw an error if the email cannot be sent', async () => {
      const deleteuser = jest.spyOn(service, 'deleteUser');
      jest
        .spyOn(mailService, 'sendMail')
        .mockRejectedValue(new Error('Test Error'));

      await expect(
        service.createUser('email@example.com', '123456789', 'John Doe'),
      ).rejects.toThrow(new Error('Test Error'));

      expect(deleteuser).toHaveBeenCalledWith('123');
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
    it('should be defined', () => {
      expect(service.updateUser).toBeDefined();
    });

    it('should update the user phone and DisplayName', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        phoneNumber: '123456788',
        displayName: 'John Smith',
      } as any);

      await service.updateUser('123', undefined, '123456789', 'John Doe');

      expect(firebaseService.auth.updateUser).toHaveBeenCalledWith('123', {
        phoneNumber: '123456789',
        displayName: 'John Doe',
      });
      expect(mailService.sendMail).not.toHaveBeenCalled();
      expect(
        firebaseService.auth.generateVerifyAndChangeEmailLink,
      ).not.toHaveBeenCalled();
      expect(firebaseService.auth.updateUser).toHaveBeenCalledTimes(1);
    });

    it('should not update the user phone and DisplayName if they are the same', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        phoneNumber: '123456789',
        displayName: 'John Doe',
      } as any);

      await service.updateUser('123', undefined, '123456789', 'John Doe');

      expect(firebaseService.auth.updateUser).toHaveBeenCalledWith('123', {});
      expect(mailService.sendMail).not.toHaveBeenCalled();
      expect(
        firebaseService.auth.generateVerifyAndChangeEmailLink,
      ).not.toHaveBeenCalled();
      expect(firebaseService.auth.updateUser).toHaveBeenCalledTimes(1);
    });

    it('should update the user email', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        email: 'john@example.com',
      } as any);

      await service.updateUser('123', 'james@example.com');

      expect(firebaseService.auth.updateUser).toHaveBeenCalledWith('123', {});
      expect(mailService.sendMail).toHaveBeenCalled();
      expect(
        firebaseService.auth.generateVerifyAndChangeEmailLink,
      ).toHaveBeenCalledWith(
        'john@example.com',
        'james@example.com',
        expect.anything(),
      );
      expect(firebaseService.auth.updateUser).toHaveBeenCalledTimes(1);
    });

    it('should fail when sending email', async () => {
      jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
        uid: '123',
        email: 'john@example.com',
        displayName: 'John Doe',
      } as any);
      jest.spyOn(mailService, 'sendMail').mockRejectedValue(new Error('Test'));

      await expect(
        service.updateUser('123', 'james@example.com', undefined, 'James Doe'),
      ).rejects.toThrow('Test');

      expect(firebaseService.auth.updateUser).toHaveBeenNthCalledWith(
        1,
        '123',
        {
          displayName: 'James Doe',
        },
      );
      expect(mailService.sendMail).toHaveBeenCalled();
      expect(
        firebaseService.auth.generateVerifyAndChangeEmailLink,
      ).toHaveBeenCalledWith(
        'john@example.com',
        'james@example.com',
        expect.anything(),
      );
      expect(firebaseService.auth.updateUser).toHaveBeenNthCalledWith(
        2,
        '123',
        {
          displayName: 'John Doe',
        },
      );
      expect(firebaseService.auth.updateUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteUser', () => {
    it('should be defined', () => {
      expect(service.deleteUser).toBeDefined();
    });

    it('should delete the user', async () => {
      await service.deleteUser('123');

      expect(firebaseService.auth.deleteUser).toHaveBeenCalledWith('123');
    });

    it('should throw an error if the user cannot be deleted', async () => {
      jest
        .spyOn(firebaseService.auth, 'deleteUser')
        .mockRejectedValue(new Error('Test'));

      await expect(service.deleteUser('123')).rejects.toThrow('Test');
    });

    it('should not throw an error if the user does not exist', async () => {
      jest
        .spyOn(firebaseService.auth, 'deleteUser')
        .mockRejectedValue({ code: 'auth/user-not-found' });

      await expect(service.deleteUser('123')).resolves.toBeUndefined();
    });
  });

  describe('deactivateUser', () => {
    it('should be defined', () => {
      expect(service.deactivateUser).toBeDefined();
    });

    it('should deactivate the user', async () => {
      await service.deactivateUser('123');

      expect(firebaseService.auth.updateUser).toHaveBeenCalledWith('123', {
        disabled: true,
      });
    });
  });

  describe('activateUser', () => {
    it('should be defined', () => {
      expect(service.activateUser).toBeDefined();
    });

    it('should activate the user', async () => {
      await service.activateUser('123');

      expect(firebaseService.auth.updateUser).toHaveBeenCalledWith('123', {
        disabled: false,
      });
    });
  });

  describe('addRoleToUser', () => {
    it('should be defined', () => {
      expect(service.addRoleToUser).toBeDefined();
    });

    describe('addVolunteerRole', () => {
      it('should add the volunteer role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
          },
        } as any);

        await service.addRoleToUser('123', Role.Volunteer, 1);

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

        await service.addRoleToUser('123', Role.Volunteer, 1);

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

        await service.addRoleToUser('123', Role.Volunteer, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Admin, Role.Volunteer],
            teamId: 1,
          },
        );
      });

      it('should throw an error if additionalInfo is not provided', async () => {
        await expect(
          service.addRoleToUser('123', Role.Volunteer),
        ).rejects.toThrow('Additional information is required for this role.');
      });
    });

    describe('addRegionManagerRole', () => {
      it('should add the region manager role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
          },
        } as any);

        await service.addRoleToUser('123', Role.RegionManager, 1);

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

        await service.addRoleToUser('123', Role.RegionManager, 1);

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

        await service.addRoleToUser('123', Role.RegionManager, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Admin, Role.RegionManager],
            managerRegions: [1],
          },
        );
      });

      it('should throw an error if additionalInfo is not provided', async () => {
        await expect(
          service.addRoleToUser('123', Role.RegionManager),
        ).rejects.toThrow('Additional information is required for this role.');
      });
    });

    describe('addRegionObserverRole', () => {
      it('should add the region observer role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
          },
        } as any);

        await service.addRoleToUser('123', Role.RegionObserver, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            should: 'not be removed',
            roles: [Role.RegionObserver],
            observerRegions: [1],
          },
        );
      });

      it('should add regionId if the user already has the region observer role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.RegionObserver],
            observerRegions: [2],
          },
        } as any);

        await service.addRoleToUser('123', Role.RegionObserver, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.RegionObserver],
            observerRegions: [2, 1],
          },
        );
      });

      it('should add the region observer role if the user has other roles', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.Admin],
          },
        } as any);

        await service.addRoleToUser('123', Role.RegionObserver, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Admin, Role.RegionObserver],
            observerRegions: [1],
          },
        );
      });

      it('should throw an error if additionalInfo is not provided', async () => {
        await expect(
          service.addRoleToUser('123', Role.RegionObserver),
        ).rejects.toThrow('Additional information is required for this role.');
      });
    });

    describe('addAdminRole', () => {
      it('should add the admin role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
          },
        } as any);

        await service.addRoleToUser('123', Role.Admin);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            should: 'not be removed',
            roles: [Role.Admin],
          },
        );
      });

      it('should add the admin role if the user has other roles', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.Volunteer],
            teamId: 1,
          },
        } as any);

        await service.addRoleToUser('123', Role.Admin);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Volunteer, Role.Admin],
            teamId: 1,
          },
        );
      });
    });
  });

  describe('removeRoleFromUser', () => {
    it('should be defined', () => {
      expect(service.removeRoleFromUser).toBeDefined();
    });

    describe('removeVolunteerRole', () => {
      it('should remove the volunteer role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
            roles: [Role.Volunteer],
            teamId: 1,
          },
        } as any);

        await service.removeRoleFromUser('123', Role.Volunteer);

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

        await service.removeRoleFromUser('123', Role.Volunteer);

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

        await service.removeRoleFromUser('123', Role.Volunteer);

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

        await service.removeRoleFromUser('123', Role.Volunteer);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Admin],
            teamId: undefined,
          },
        );
      });
    });

    describe('removeRegionManagerRole', () => {
      it('should remove the region manager role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
            roles: [Role.RegionManager],
            managerRegions: [1],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.RegionManager, 1);

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

        await service.removeRoleFromUser('123', Role.RegionManager, 1);

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

        await service.removeRoleFromUser('123', Role.RegionManager, 1);

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

        await service.removeRoleFromUser('123', Role.RegionManager, 1);

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

        await service.removeRoleFromUser('123', Role.RegionManager, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Admin],
            managerRegions: undefined,
          },
        );
      });

      it('should remove all regions if the regionId is not provided', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.RegionManager],
            managerRegions: [1, 2],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.RegionManager);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [],
            managerRegions: undefined,
          },
        );
      });
    });

    describe('removeRegionObserverRole', () => {
      it('should remove the region observer role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
            roles: [Role.RegionObserver],
            observerRegions: [1],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.RegionObserver, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            should: 'not be removed',
            roles: [],
            observerRegions: undefined,
          },
        );
      });

      it('should remove the regionId if the user have other regions', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
            roles: [Role.RegionObserver],
            observerRegions: [1, 2],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.RegionObserver, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            should: 'not be removed',
            roles: [Role.RegionObserver],
            observerRegions: [2],
          },
        );
      });

      it('should remove the region observer role if the user has other roles', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.RegionObserver, Role.Admin],
            observerRegions: [1],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.RegionObserver, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Admin],
            observerRegions: undefined,
          },
        );
      });

      it('should do nothing if the user does not have the region observer role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.Admin],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.RegionObserver, 1);

        expect(firebaseService.auth.setCustomUserClaims).not.toHaveBeenCalled();
      });

      it('should clear the regionId if the user does not have the region observer role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.Admin],
            observerRegions: [1],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.RegionObserver, 1);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Admin],
            observerRegions: undefined,
          },
        );
      });

      it('should remove all regions if the regionId is not provided', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.RegionObserver],
            observerRegions: [1, 2],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.RegionObserver);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [],
            observerRegions: undefined,
          },
        );
      });
    });

    describe('removeAdminRole', () => {
      it('should remove the admin role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            should: 'not be removed',
            roles: [Role.Admin],
          },
        } as any);

        await service.removeRoleFromUser('123', Role.Admin);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            should: 'not be removed',
            roles: [],
          },
        );
      });

      it('should remove the admin role if the user has other roles', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.Admin, Role.Volunteer],
            teamId: 1,
          },
        } as any);

        await service.removeRoleFromUser('123', Role.Admin);

        expect(firebaseService.auth.setCustomUserClaims).toHaveBeenCalledWith(
          '123',
          {
            roles: [Role.Volunteer],
            teamId: 1,
          },
        );
      });

      it('should do nothing if the user does not have the admin role', async () => {
        jest.spyOn(firebaseService.auth, 'getUser').mockResolvedValue({
          uid: '123',
          customClaims: {
            roles: [Role.Volunteer],
            teamId: 1,
          },
        } as any);

        await service.removeRoleFromUser('123', Role.Admin);

        expect(firebaseService.auth.setCustomUserClaims).not.toHaveBeenCalled();
      });
    });
  });
});
