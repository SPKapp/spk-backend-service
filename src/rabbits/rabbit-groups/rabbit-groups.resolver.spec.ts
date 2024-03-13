import { Test, TestingModule } from '@nestjs/testing';
import { RabbitGroupsResolver } from './rabbit-groups.resolver';
import { RabbitGroupsService } from './rabbit-groups.service';

describe('RabbitGroupsResolver', () => {
  let resolver: RabbitGroupsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitGroupsResolver, RabbitGroupsService],
    }).compile();

    resolver = module.get<RabbitGroupsResolver>(RabbitGroupsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  // TODO: Add tests
});
