import { Test, TestingModule } from '@nestjs/testing';

import {
  userAdmin,
  userNoRoles,
  userRegionManager,
  userRegionManagerAndObserver,
  userRegionObserver,
  userRegionObserverAndVolunteer,
  userVolunteer,
} from '../common/tests/user-details.template';

import {
  RabbitPhotosAccessType,
  RabbitsAccessService,
} from './rabbits-access.service';
import { RabbitsService } from './rabbits/rabbits.service';
import { RabbitGroupsService } from './rabbit-groups/rabbit-groups.service';
import { Rabbit, RabbitGroup } from './entities';

describe('RabbitsAccessService', () => {
  let service: RabbitsAccessService;
  let rabbitsService: RabbitsService;
  let rabbitGroupsService: RabbitGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitsAccessService,
        {
          provide: RabbitsService,
          useValue: {
            findOne: jest.fn(),
            exists: jest.fn(),
          },
        },
        {
          provide: RabbitGroupsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitsAccessService>(RabbitsAccessService);
    rabbitsService = module.get<RabbitsService>(RabbitsService);
    rabbitGroupsService = module.get<RabbitGroupsService>(RabbitGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAccess', () => {
    it('should be defined', () => {
      expect(service.validateAccess).toBeDefined();
    });

    describe('allow users', () => {
      beforeEach(() => {
        jest.spyOn(rabbitsService, 'findOne').mockResolvedValue(new Rabbit());
      });

      it('should allow access for admin', async () => {
        expect(await service.validateAccess(1, userAdmin)).toBe(true);

        expect(rabbitsService.findOne).not.toHaveBeenCalled();
      });

      it('should allow access for region manager', async () => {
        expect(await service.validateAccess(1, userRegionManager)).toBe(true);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(
          1,
          userRegionManager.managerRegions,
          undefined,
        );
      });

      it('should allow access for region observer', async () => {
        expect(await service.validateAccess(1, userRegionObserver)).toBe(true);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(
          1,
          userRegionObserver.observerRegions,
          undefined,
        );
      });

      it('should allow access for volunteer', async () => {
        expect(await service.validateAccess(1, userVolunteer)).toBe(true);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(1, undefined, [
          userVolunteer.teamId,
        ]);
      });

      it('should allow access for region manager and observer', async () => {
        expect(
          await service.validateAccess(2, userRegionManagerAndObserver),
        ).toBe(true);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(
          2,
          userRegionManagerAndObserver.regions,
          undefined,
        );
      });
    });

    describe('deny access', () => {
      beforeEach(() => {
        jest.spyOn(rabbitsService, 'findOne').mockResolvedValue(null);
      });

      it('should deny access for unknown role', async () => {
        expect(await service.validateAccess(1, userNoRoles)).toBe(false);

        expect(rabbitsService.findOne).not.toHaveBeenCalled();
      });

      it('should deny access for region manager', async () => {
        expect(await service.validateAccess(1, userRegionManager)).toBe(false);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(
          1,
          userRegionManager.managerRegions,
          undefined,
        );
      });

      it('should deny access for region observer', async () => {
        expect(await service.validateAccess(1, userRegionObserver)).toBe(false);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(
          1,
          userRegionObserver.observerRegions,
          undefined,
        );
      });

      it('should deny editable access for region observer', async () => {
        expect(await service.validateAccess(2, userRegionObserver, true)).toBe(
          false,
        );

        expect(rabbitsService.findOne).not.toHaveBeenCalled();
      });

      it('should deny access for volunteer', async () => {
        expect(await service.validateAccess(1, userVolunteer)).toBe(false);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(1, undefined, [
          userVolunteer.teamId,
        ]);
      });
    });
  });

  describe('validateAccessForRabbitGroup', () => {
    it('should be defined', () => {
      expect(service.validateAccessForRabbitGroup).toBeDefined();
    });

    describe('allow access', () => {
      beforeEach(() => {
        jest
          .spyOn(rabbitGroupsService, 'findOne')
          .mockResolvedValue(new RabbitGroup());
      });

      it('should allow access for admin', async () => {
        expect(await service.validateAccessForRabbitGroup(1, userAdmin)).toBe(
          true,
        );

        expect(rabbitsService.findOne).not.toHaveBeenCalled();
      });

      it('should allow access for region manager', async () => {
        expect(
          await service.validateAccessForRabbitGroup(1, userRegionManager),
        ).toBe(true);

        expect(rabbitGroupsService.findOne).toHaveBeenCalledWith(
          1,
          userRegionManager.managerRegions,
        );
      });
    });

    describe('deny access', () => {
      beforeEach(() => {
        jest.spyOn(rabbitGroupsService, 'findOne').mockResolvedValue(null);
      });

      it('should deny access for unknown role', async () => {
        expect(await service.validateAccessForRabbitGroup(1, userNoRoles)).toBe(
          false,
        );

        expect(rabbitGroupsService.findOne).not.toHaveBeenCalled();
      });

      it('should deny access for region manager', async () => {
        expect(
          await service.validateAccessForRabbitGroup(1, userRegionManager),
        ).toBe(false);

        expect(rabbitGroupsService.findOne).toHaveBeenCalledWith(
          1,
          userRegionManager.managerRegions,
        );
      });
    });

    describe('grantPhotoAccess', () => {
      it('should be defined', () => {
        expect(service.grantPhotoAccess).toBeDefined();
      });

      it('should allow access for admin', async () => {
        jest.spyOn(rabbitsService, 'exists').mockResolvedValue(true);

        await expect(service.grantPhotoAccess(1, userAdmin)).resolves.toEqual(
          RabbitPhotosAccessType.Full,
        );

        expect(rabbitsService.exists).toHaveBeenCalledWith(1);
      });

      it('should deny access for admin if rabbit does not exist', async () => {
        jest.spyOn(rabbitsService, 'exists').mockResolvedValue(false);

        await expect(service.grantPhotoAccess(1, userAdmin)).resolves.toEqual(
          RabbitPhotosAccessType.Deny,
        );

        expect(rabbitsService.exists).toHaveBeenCalledWith(1);
      });

      it('should allow access for region manager', async () => {
        jest.spyOn(rabbitsService, 'exists').mockResolvedValue(true);

        await expect(
          service.grantPhotoAccess(1, userRegionManager),
        ).resolves.toEqual(RabbitPhotosAccessType.Full);

        expect(rabbitsService.exists).toHaveBeenCalledWith(
          1,
          userRegionManager.managerRegions,
        );
      });

      it('should allow access for region observer', async () => {
        jest.spyOn(rabbitsService, 'exists').mockResolvedValue(true);

        await expect(
          service.grantPhotoAccess(1, userRegionObserver),
        ).resolves.toEqual(RabbitPhotosAccessType.Full);

        expect(rabbitsService.exists).toHaveBeenCalledWith(
          1,
          userRegionObserver.observerRegions,
        );
      });

      it('should allow access for region manager and observer', async () => {
        jest.spyOn(rabbitsService, 'exists').mockResolvedValue(true);

        await expect(
          service.grantPhotoAccess(1, userRegionManagerAndObserver),
        ).resolves.toEqual(RabbitPhotosAccessType.Full);

        expect(rabbitsService.exists).toHaveBeenCalledWith(
          1,
          userRegionManagerAndObserver.regions,
        );
      });

      it('should allow access for volunteer', async () => {
        jest.spyOn(rabbitsService, 'exists').mockResolvedValue(true);

        await expect(
          service.grantPhotoAccess(1, userVolunteer),
        ).resolves.toEqual(RabbitPhotosAccessType.Own);

        expect(rabbitsService.exists).toHaveBeenCalledWith(1, undefined, [
          userVolunteer.teamId,
        ]);
      });

      it('should allow access for volunteer and region observer', async () => {
        jest
          .spyOn(rabbitsService, 'exists')
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true);

        await expect(
          service.grantPhotoAccess(1, userRegionObserverAndVolunteer),
        ).resolves.toEqual(RabbitPhotosAccessType.Own);

        expect(rabbitsService.exists).toHaveBeenNthCalledWith(
          1,
          1,
          userRegionObserverAndVolunteer.observerRegions,
        );
        expect(rabbitsService.exists).toHaveBeenNthCalledWith(2, 1, undefined, [
          userRegionObserverAndVolunteer.teamId,
        ]);
      });

      it('should deny access for volunteer if rabbit does not exist', async () => {
        jest.spyOn(rabbitsService, 'exists').mockResolvedValue(false);

        await expect(
          service.grantPhotoAccess(1, userVolunteer),
        ).resolves.toEqual(RabbitPhotosAccessType.Deny);

        expect(rabbitsService.exists).toHaveBeenCalledWith(1, undefined, [
          userVolunteer.teamId,
        ]);
      });
    });
  });
});
