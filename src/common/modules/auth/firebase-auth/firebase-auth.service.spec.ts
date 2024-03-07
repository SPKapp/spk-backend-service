import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseService } from '../../firebase/firebase.service';

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthService,
        { provide: FirebaseService, useValue: {} },
      ],
    }).compile();

    service = module.get<FirebaseAuthService>(FirebaseAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
