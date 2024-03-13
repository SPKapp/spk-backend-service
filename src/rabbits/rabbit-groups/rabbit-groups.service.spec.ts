import { Test, TestingModule } from '@nestjs/testing';
import { In } from 'typeorm';

import { Region } from '../../common/modules/regions/entities/region.entity';

import { RabbitGroupsService } from './rabbit-groups.service';

import { RabbitGroup } from '../entities/rabbit-group.entity';

describe('RabbitGroupsService', () => {
  let service: RabbitGroupsService;
  let rabbitGroupRepository: any;

  const rabbitGroups = [
    new RabbitGroup({ id: 1, region: new Region({ id: 1 }) }),
    new RabbitGroup({ id: 2, region: new Region({ id: 2 }) }),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitGroupsService,
        {
          provide: 'RabbitGroupRepository',
          useValue: {
            // save: jest.fn(() => rabbitGroups[0]),
            find: jest.fn(() => rabbitGroups),
            countBy: jest.fn(() => rabbitGroups.length),
            findOneBy: jest.fn(() => rabbitGroups[0]),
            // update: jest.fn(() => rabbitGroups[0]),
            // remove: jest.fn(() => rabbitGroups[0].id),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitGroupsService>(RabbitGroupsService);
    rabbitGroupRepository = module.get('RabbitGroupRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    // TODO: Add tests
  });

  describe('findAllPaginated', () => {
    it('should be defined', () => {
      expect(service.findAllPaginated).toBeDefined();
    });

    it('should return a paginated list of rabbit groups', async () => {
      await expect(service.findAllPaginated()).resolves.toEqual({
        data: rabbitGroups,
        offset: 0,
        limit: 10,
      });
    });

    it('should return a paginated list of rabbit groups with the specified offset and limit', async () => {
      const offset = 1;
      const limit = 1;

      await expect(service.findAllPaginated(offset, limit)).resolves.toEqual({
        data: rabbitGroups,
        offset,
        limit,
      });
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should return a list of rabbit groups', async () => {
      await expect(service.findAll()).resolves.toEqual(rabbitGroups);

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: { region: { id: undefined } },
      });
    });

    it('should return a list of rabbit groups with the specified regions', async () => {
      const regionsIds = [1, 2];

      await expect(service.findAll(regionsIds)).resolves.toEqual(rabbitGroups);

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: { region: { id: In(regionsIds) } },
      });
    });

    it('should return a list of rabbit groups with the specified offset and limit', async () => {
      const offset = 1;
      const limit = 1;

      await expect(service.findAll(undefined, offset, limit)).resolves.toEqual(
        rabbitGroups,
      );

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: offset,
        take: limit,
        where: { region: { id: undefined } },
      });
    });
  });

  describe('count', () => {
    it('should be defined', () => {
      expect(service.count).toBeDefined();
    });

    it('should return the number of rabbit groups', async () => {
      await expect(service.count()).resolves.toEqual(rabbitGroups.length);

      expect(rabbitGroupRepository.countBy).toHaveBeenCalledWith({
        region: { id: undefined },
      });
    });

    it('should return the number of rabbit groups with the specified regions', async () => {
      const regionsIds = [1, 2];

      await expect(service.count(regionsIds)).resolves.toEqual(
        rabbitGroups.length,
      );

      expect(rabbitGroupRepository.countBy).toHaveBeenCalledWith({
        region: { id: In(regionsIds) },
      });
    });
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should return a rabbit group', async () => {
      await expect(service.findOne(rabbitGroups[0].id)).resolves.toEqual(
        rabbitGroups[0],
      );

      expect(rabbitGroupRepository.findOneBy).toHaveBeenCalledWith({
        id: rabbitGroups[0].id,
      });
    });
  });

  describe('update', () => {
    it('should be defined', () => {
      expect(service.update).toBeDefined();
    });

    // TODO: Add tests
  });

  describe('remove', () => {
    it('should be defined', () => {
      expect(service.remove).toBeDefined();
    });

    // TODO: Add tests
  });
});
