import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { RegionService } from './regions.service';
import { Region } from './entities/region.entity';

describe('RegionService', () => {
  let service: RegionService;
  let regionRepository: any;

  const regions = [
    new Region({
      id: 1,
      name: 'Region 1',
      teams: new Promise((res) => res([])),
    }),
    new Region({
      id: 2,
      name: 'Region 2',
      teams: new Promise((res) => res([])),
    }),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionService,
        {
          provide: 'RegionRepository',
          useValue: {
            save: jest.fn(() => regions[0]),
            find: jest.fn(() => regions),
            count: jest.fn(() => regions.length),
            findOneBy: jest.fn(() => regions[0]),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegionService>(RegionService);
    regionRepository = module.get('RegionRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should create a region', async () => {
      const input = { name: 'Region 1' };
      const expected = new Region({ id: 1, ...input });

      jest.spyOn(service, 'create').mockResolvedValue(expected);

      await expect(service.create(input)).resolves.toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should find all regions', async () => {
      await expect(service.findAll(0, 10)).resolves.toEqual(regions);
      expect(regionRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
    });

    it('should find all regions', async () => {
      await expect(service.findAll()).resolves.toEqual(regions);
      expect(regionRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
      });
    });
  });

  describe('count', () => {
    it('should be defined', () => {
      expect(service.count).toBeDefined();
    });

    it('should count regions', async () => {
      await expect(service.count()).resolves.toEqual(regions.length);
      expect(regionRepository.count).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should find a region', async () => {
      await expect(service.findOne(regions[0].id)).resolves.toEqual(regions[0]);
      expect(regionRepository.findOneBy).toHaveBeenCalledWith({
        id: regions[0].id,
      });
    });
  });

  describe('update', () => {
    it('should be defined', () => {
      expect(service.update).toBeDefined();
    });

    it('should update a region', async () => {
      await expect(service.update(regions[0].id, regions[0])).resolves.toEqual(
        regions[0],
      );
    });

    it('should throw an error if region is not found', async () => {
      jest.spyOn(regionRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.update(regions[0].id, regions[0])).rejects.toThrow(
        `Region with ID ${regions[0].id} not found`,
      );
    });
  });

  describe('remove', () => {
    it('should be defined', () => {
      expect(service.remove).toBeDefined();
    });

    it('should remove a region', async () => {
      await expect(service.remove(regions[0].id)).resolves.toEqual(
        regions[0].id,
      );
    });

    it('should throw an error if region is not found', async () => {
      jest.spyOn(regionRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.remove(regions[0].id)).rejects.toThrow(
        new NotFoundException(`Region with ID ${regions[0].id} not found`),
      );
    });

    it('should throw an error if region is in use by a team', async () => {
      jest.spyOn(regionRepository, 'findOneBy').mockResolvedValue({
        id: 1,
        teams: [{}],
      });

      await expect(service.remove(regions[0].id)).rejects.toThrow(
        new BadRequestException('Region is in use by a team'),
      );
    });
  });
});
