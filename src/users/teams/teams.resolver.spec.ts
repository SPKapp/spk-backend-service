import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseAuthGuard } from '../../common/modules/auth/firebase-auth/firebase-auth.guard';
import { TeamsResolver } from './teams.resolver';
import { TeamsService } from './teams.service';

describe('TeamsResolver', () => {
  let resolver: TeamsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsResolver,
        {
          provide: TeamsService,
          useFactory: () => ({
            findAll: jest.fn(() => true),
            findOne: jest.fn(() => true),
          }),
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<TeamsResolver>(TeamsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});

// TODO: Add tests
