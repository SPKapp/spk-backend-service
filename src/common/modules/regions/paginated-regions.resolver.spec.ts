import { Test, TestingModule } from '@nestjs/testing';
import { PaginatedRegionsResolver } from './paginated-regions.resolver';
import { Region } from './entities/region.entity';
import { RegionService } from './regions.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth/firebase-auth.guard';

describe('PaginatedRegionsResolver', () => {
  let resolver: PaginatedRegionsResolver;
  let regionsService: RegionService;

  const regions = [new Region({ id: 1 }), new Region({ id: 2 })];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedRegionsResolver,
        {
          provide: RegionService,
          useValue: {
            findAll: jest.fn(() => regions),
          },
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<PaginatedRegionsResolver>(PaginatedRegionsResolver);
    regionsService = module.get<RegionService>(RegionService);
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
