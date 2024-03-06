import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: 'TeamRepository',
          useValue: {
            find: jest.fn(),
            findOneByOrFail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

// TODO: Add tests
