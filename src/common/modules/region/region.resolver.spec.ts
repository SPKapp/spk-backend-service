import { Test, TestingModule } from '@nestjs/testing';

import { RegionResolver } from './region.resolver';
import { RegionService } from './region.service';

describe('RegionResolver', () => {
  let resolver: RegionResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionResolver,
        {
          provide: RegionService,
          useFactory: () => ({
            create: jest.fn(() => true),
            findAll: jest.fn(() => true),
            findOne: jest.fn(() => true),
            update: jest.fn(() => true),
            remove: jest.fn(() => true),
          }),
        },
      ],
    }).compile();

    resolver = module.get<RegionResolver>(RegionResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});

// TODO: Add tests
