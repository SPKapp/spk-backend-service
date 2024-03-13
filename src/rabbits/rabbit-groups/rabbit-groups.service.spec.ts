import { Test, TestingModule } from '@nestjs/testing';
import { RabbitGroupsService } from './rabbit-groups.service';

describe('RabbitGroupsService', () => {
  let service: RabbitGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitGroupsService],
    }).compile();

    service = module.get<RabbitGroupsService>(RabbitGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Add tests
});
