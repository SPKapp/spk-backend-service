import { Test, TestingModule } from '@nestjs/testing';

import { RegionService } from '../../common/modules/region/region.service';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RegionService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: 'TeamRepository',
          useValue: {
            findBy: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        TeamsService,
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

// TODO: Add tests
