import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import {
  paginatedFields,
  paginatedFieldsWithTotalCount,
  userAdmin,
  userRegionManager,
} from '../../tests';
import { FirebaseAuthGuard } from '../auth';

import { PaginatedRegionsResolver } from './paginated-regions.resolver';
import { RegionsService } from './regions.service';

import { Region } from './entities';

describe(PaginatedRegionsResolver, () => {
  let resolver: PaginatedRegionsResolver;
  let regionsService: RegionsService;

  const regions = [new Region({ id: 1 }), new Region({ id: 2 })];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedRegionsResolver,
        {
          provide: RegionsService,
          useValue: {
            findAllPaginated: jest.fn((_, totalCount) => ({
              data: regions,
              offset: 0,
              limit: 10,
              totalCount: totalCount ? regions.length : undefined,
            })),
          },
        },
      ],
    })

      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<PaginatedRegionsResolver>(PaginatedRegionsResolver);
    regionsService = module.get<RegionsService>(RegionsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(resolver.findAll).toBeDefined();
    });

    it('should return all regions', async () => {
      await expect(
        resolver.findAll(userAdmin, paginatedFields, { offset: 0, limit: 10 }),
      ).resolves.toEqual({
        data: regions,
        offset: 0,
        limit: 10,
      });

      expect(regionsService.findAllPaginated).toHaveBeenCalledWith(
        {
          offset: 0,
          limit: 10,
        },
        false,
      );
    });

    it('should return regions if the user is an Admin and regionsIds are provided', async () => {
      await expect(
        resolver.findAll(userAdmin, paginatedFields, {
          offset: 0,
          limit: 10,
          ids: [1],
        }),
      ).resolves.toEqual({
        data: regions,
        offset: 0,
        limit: 10,
      });

      expect(regionsService.findAllPaginated).toHaveBeenCalledWith(
        {
          offset: 0,
          limit: 10,
          ids: [1],
        },
        false,
      );
    });

    it('should return regions from the user regions if the user is a Region Manager', async () => {
      await expect(
        resolver.findAll(userRegionManager, paginatedFields, {
          offset: 0,
          limit: 10,
        }),
      ).resolves.toEqual({
        data: regions,
        offset: 0,
        limit: 10,
      });

      expect(regionsService.findAllPaginated).toHaveBeenCalledWith(
        {
          offset: 0,
          limit: 10,
          ids: userRegionManager.managerRegions,
        },
        false,
      );
    });

    it('should throw a ForbiddenException if the user is a Region Manager and tries to access regions from other regions', async () => {
      await expect(
        resolver.findAll(userRegionManager, paginatedFields, {
          offset: 0,
          limit: 10,
          ids: [1, 2],
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'User does not have access to at least one of the regions.',
          'wrong-arg-region',
        ),
      );
    });

    it('should return regions with totalCount if totalCount is requested', async () => {
      await expect(
        resolver.findAll(userAdmin, paginatedFieldsWithTotalCount, {
          offset: 0,
          limit: 10,
        }),
      ).resolves.toEqual({
        data: regions,
        offset: 0,
        limit: 10,
        totalCount: regions.length,
      });

      expect(regionsService.findAllPaginated).toHaveBeenCalledWith(
        {
          offset: 0,
          limit: 10,
        },
        true,
      );
    });
  });
});
