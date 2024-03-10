import { Test, TestingModule } from '@nestjs/testing';

import { RegionResolver } from './regions.resolver';
import { RegionService } from './regions.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth/firebase-auth.guard';

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
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<RegionResolver>(RegionResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});

// TODO: Add tests
