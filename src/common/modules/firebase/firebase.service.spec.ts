import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseService } from './firebase.service';
import { Firebase } from './firebase';

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Firebase, FirebaseService],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

// TODO: Add tests
