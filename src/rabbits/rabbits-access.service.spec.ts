import { Test, TestingModule } from '@nestjs/testing';

import {
  userAdmin,
  userNoRoles,
  userRegionManager,
  userRegionObserver,
  userVolunteer,
} from '../common/tests/user-details.template';

import { RabbitsAccessService } from './rabbits-access.service';
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
          userRegionManager.regions,
          undefined,
        );
      });

      it('should allow access for region observer', async () => {
        expect(await service.validateAccess(1, userRegionObserver)).toBe(true);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(
          1,
          userRegionObserver.regions,
          undefined,
        );
      });

      it('should allow access for volunteer', async () => {
        expect(await service.validateAccess(1, userVolunteer)).toBe(true);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(1, undefined, [
          userVolunteer.teamId,
        ]);
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
          userRegionManager.regions,
          undefined,
        );
      });

      it('should deny access for region observer', async () => {
        expect(await service.validateAccess(1, userRegionObserver)).toBe(false);

        expect(rabbitsService.findOne).toHaveBeenCalledWith(
          1,
          userRegionObserver.regions,
          undefined,
        );
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
          userRegionManager.regions,
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
          userRegionManager.regions,
        );
      });
    });
  });
});
