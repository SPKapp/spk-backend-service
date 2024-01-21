import { Test, TestingModule } from '@nestjs/testing';

import { RegionResolver } from './region.resolver';
import { RegionService } from './region.service';

describe('RegionResolver', () => {
  let resolver: RegionResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegionResolver, RegionService],
    }).compile();

    resolver = module.get<RegionResolver>(RegionResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});

// TODO: Add tests
