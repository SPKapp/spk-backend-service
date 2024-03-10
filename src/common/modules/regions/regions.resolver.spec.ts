import { Test, TestingModule } from '@nestjs/testing';

import { RegionsResolver } from './regions.resolver';
import { RegionsService } from './regions.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth/firebase-auth.guard';

import { Region } from './entities/region.entity';
import { Role } from '../auth/roles.eum';
import { UserDetails } from '../auth/current-user/current-user';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

describe('RegionResolver', () => {
  let resolver: RegionsResolver;
  let regionsService: RegionsService;

  const userDetailsTeplate: UserDetails = {
    uid: '123',
    email: 'email1@example.com',
    phone: '123456789',
    roles: [],
    regions: [],
  };

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
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      jest.spyOn(regionsService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userDetails, 1)).rejects.toThrow(
        new NotFoundException(`Region with ID 1 not found`),
      );
    });

    it('should throw bad permissions error', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.RegionManager],
        regions: [regions[1].id],
      };

      await expect(
        resolver.findOne(userDetails, regions[0].id),
      ).rejects.toThrow(
        new ForbiddenException(
          'Region does not belong to the Region Manager permissions.',
        ),
      );
    });

    it('should return a region', async () => {
      const userDetails: UserDetails = {
        ...userDetailsTeplate,
        roles: [Role.Admin],
      };

      await expect(
        resolver.findOne(userDetails, regions[0].id),
      ).resolves.toEqual(regions[0]);
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
