import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseAuthService } from '../../common/modules/auth/firebase-auth/firebase-auth.service';
import { UsersService } from './users.service';
import { TeamsService } from '../teams/teams.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: TeamsService, useValue: {} },
        { provide: FirebaseAuthService, useValue: {} },
        {
          provide: 'UserRepository',
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
