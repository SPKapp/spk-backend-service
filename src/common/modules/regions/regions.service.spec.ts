import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';

import { RegionsService } from './regions.service';
import { PermissionsService } from '../../../users';

import { Region } from './entities';
import { Team } from '../../../users/entities';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => jest.fn(),
}));

describe('regionsService', () => {
  let service: RegionsService;
  let regionRepository: Repository<Region>;

  const regions = [
    new Region({
      id: 1,
      name: 'Region 1',
      teams: new Promise((res) => res([])),
      users: new Promise((res) => res([])),
      rabbitGroups: new Promise((res) => res([])),
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
        RegionsService,
        {
          provide: getRepositoryToken(Region),
          useValue: {
            save: jest.fn(() => regions[0]),
            find: jest.fn(() => regions),
            countBy: jest.fn(() => regions.length),
            findOneBy: jest.fn(() => regions[0]),
            softRemove: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            removePermissionsForRegion: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegionsService>(RegionsService);
    regionRepository = module.get<Repository<Region>>(
      getRepositoryToken(Region),
    );
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

  describe('findAllPaginated', () => {
    it('should be defined', () => {
      expect(service.findAllPaginated).toBeDefined();
    });

    it('should find all regions paginated', async () => {
      await expect(
        service.findAllPaginated({ offset: 10, limit: 20 }),
      ).resolves.toEqual({
        data: regions,
        offset: 10,
        limit: 20,
        totalCount: undefined,
      });
      expect(regionRepository.find).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        where: {
          id: undefined,
          name: undefined,
        },
      });
    });

    it('should find all regions paginated - totalcount', async () => {
      await expect(service.findAllPaginated(undefined, true)).resolves.toEqual({
        data: regions,
        offset: 0,
        limit: 10,
        totalCount: regions.length,
      });
      expect(regionRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          id: undefined,
          name: undefined,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should find all regions - offset and limit', async () => {
      await expect(
        service.findAll({
          offset: 0,
          limit: 10,
        }),
      ).resolves.toEqual(regions);
      expect(regionRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          id: undefined,
          name: undefined,
        },
      });
    });

    it('should find all regions', async () => {
      await expect(service.findAll()).resolves.toEqual(regions);
      expect(regionRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          id: undefined,
          name: undefined,
        },
      });
    });

    it('should find all regions by name', async () => {
      await expect(
        service.findAll({
          name: 'Region ',
        }),
      ).resolves.toEqual(regions);
      expect(regionRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          name: ILike('%Region %'),
        },
      });
    });

    it('should find all regions by ID', async () => {
      await expect(
        service.findAll({
          ids: [1, 2],
        }),
      ).resolves.toEqual(regions);
      expect(regionRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          id: In([1, 2]),
          name: undefined,
        },
      });
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

  describe('findOneByName', () => {
    it('should be defined', () => {
      expect(service.findOneByName).toBeDefined();
    });

    it('should find a region by name', async () => {
      await expect(service.findOneByName(regions[0].name)).resolves.toEqual(
        regions[0],
      );
      expect(regionRepository.findOneBy).toHaveBeenCalledWith({
        name: regions[0].name,
      });
    });
  });

  describe('update', () => {
    it('should be defined', () => {
      expect(service.update).toBeDefined();
    });

    it('should update a region', async () => {
      await expect(
        service.update(regions[0].id, {
          ...regions[0],
          name: 'Region 1 Updated',
        }),
      ).resolves.toEqual({
        ...regions[0],
        name: 'Region 1 Updated',
      });

      expect(regionRepository.save).toHaveBeenCalledWith({
        ...regions[0],
        name: 'Region 1 Updated',
      });
    });

    it('should throw an error if region is not found', async () => {
      jest.spyOn(regionRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.update(regions[0].id, regions[0])).rejects.toThrow(
        `Region not found`,
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
        new NotFoundException(`Region not found`),
      );
    });

    it('should throw an error if region is in use by a team', async () => {
      jest.spyOn(regionRepository, 'findOneBy').mockResolvedValue(
        new Region({
          id: 1,
          name: 'Region 1',
          teams: new Promise((res) => res([new Team({})])),
          users: new Promise((res) => res([])),
          rabbitGroups: new Promise((res) => res([])),
        }),
      );

      await expect(service.remove(regions[0].id)).rejects.toThrow(
        new BadRequestException('Region cannot be removed. It is in use.'),
      );
    });
  });
});
