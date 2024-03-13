import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseAuthGuard, getCurrentUserPipe } from '../auth/auth.module';

import { PaginatedRegionsResolver } from './paginated-regions.resolver';
import { RegionsService } from './regions.service';

import { Region } from './entities/region.entity';

describe('PaginatedRegionsResolver', () => {
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
            findAll: jest.fn(() => regions),
          },
        },
      ],
    })
      .overridePipe(getCurrentUserPipe)
      .useValue({ transform: jest.fn((currentUser) => currentUser) })
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

    it('should return regions', async () => {
      await expect(resolver.findAll({ offset: 0, limit: 10 })).resolves.toEqual(
        {
          data: regions,
          offset: 0,
          limit: 10,
        },
      );

      expect(regionsService.findAll).toHaveBeenCalledWith(0, 10);
    });
  });
});
