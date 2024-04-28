import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
} from '../../tests/user-details.template';
import {
  AuthService,
  FirebaseAuthGuard,
  getCurrentUserPipe,
} from '../../modules/auth/auth.module';

import { RegionsResolver } from './regions.resolver';
import { RegionsService } from './regions.service';

import { Region } from './entities/region.entity';

describe('RegionResolver', () => {
  let resolver: RegionsResolver;
  let regionsService: RegionsService;

  const regions = [new Region({ id: 1 }), new Region({ id: 2 })];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionsResolver,
        AuthService,
        {
          provide: RegionsService,
          useFactory: () => ({
            create: jest.fn(() => regions[0]),
            findOne: jest.fn(() => regions[0]),
            update: jest.fn(() => regions[0]),
            remove: jest.fn(() => regions[0].id),
          }),
        },
      ],
    })

      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<RegionsResolver>(RegionsResolver);
    regionsService = module.get<RegionsService>(RegionsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createRegion', () => {
    it('should be defined', () => {
      expect(resolver.createRegion).toBeDefined();
    });

    it('should create a region', async () => {
      await expect(
        resolver.createRegion({ name: regions[0].name }),
      ).resolves.toEqual(regions[0]);
    });
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    it('should throw not found error', async () => {
      jest.spyOn(regionsService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userAdmin, 1)).rejects.toThrow(
        new NotFoundException(`Region with ID 1 not found`),
      );
    });

    it('should throw bad permissions error', async () => {
      await expect(
        resolver.findOne(userRegionManager, regions[0].id),
      ).rejects.toThrow(
        new ForbiddenException(
          'Region does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should return a region', async () => {
      await expect(resolver.findOne(userAdmin, regions[0].id)).resolves.toEqual(
        regions[0],
      );
    });
  });

  describe('updateRegion', () => {
    it('should be defined', () => {
      expect(resolver.updateRegion).toBeDefined();
    });

    it('should update a region', async () => {
      await expect(
        resolver.updateRegion({ id: regions[0].id, name: regions[0].name }),
      ).resolves.toEqual(regions[0]);
    });
  });

  describe('removeRegion', () => {
    it('should be defined', () => {
      expect(resolver.removeRegion).toBeDefined();
    });

    it('should remove a region', async () => {
      await expect(resolver.removeRegion(regions[0].id)).resolves.toEqual({
        id: regions[0].id,
      });
    });
  });
});
