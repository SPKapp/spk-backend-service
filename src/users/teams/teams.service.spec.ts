import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';

import { RegionService } from '../../common/modules/regions/regions.service';
import { TeamsService } from './teams.service';

import { Region } from '../../common/modules/regions/entities/region.entity';

describe('TeamsService', () => {
  let service: TeamsService;
  let regionService: RegionService;
  let teamRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RegionService,
          useValue: {
            findOne: jest.fn(() => null),
          },
        },
        {
          provide: 'TeamRepository',
          useValue: {
            find: jest.fn(),
            countBy: jest.fn(),
            findOneBy: jest.fn(() => null),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        TeamsService,
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    regionService = module.get<RegionService>(RegionService);
    teamRepository = module.get('TeamRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('shoud be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should throw an error if the region with the provided ID does not exist', async () => {
      await expect(service.create(1)).rejects.toThrow(
        new BadRequestException('Region with the provided id does not exist'),
      );
      expect(teamRepository.save).not.toHaveBeenCalled();
    });

    it('should create a new team', async () => {
      const region = { id: 1 };
      const team = {
        id: 1,
        region: new Region(region),
      };
      jest
        .spyOn(regionService, 'findOne')
        .mockResolvedValue(new Region(region));
      jest.spyOn(teamRepository, 'save').mockResolvedValue(team);

      await expect(service.create(1)).resolves.toEqual(team);
      expect(teamRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const teams = [{ id: 1 }, { id: 2 }];

    beforeEach(() => {
      jest.spyOn(teamRepository, 'find').mockResolvedValue(teams);
    });

    it('shoud be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should retrieve all teams', async () => {
      await expect(service.findAll()).resolves.toEqual(teams);

      expect(teamRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          region: { id: undefined },
        },
      });
    });

    it('should retrieve teams based on the provided regions IDs', async () => {
      await expect(service.findAll([1, 2])).resolves.toEqual(teams);

      expect(teamRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          region: { id: In([1, 2]) },
        },
      });
    });

    it('should retrieve teams based on the provided regions IDs and pagination params', async () => {
      await expect(service.findAll([1, 2], 0, 10)).resolves.toEqual(teams);

      expect(teamRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          region: { id: In([1, 2]) },
        },
      });
    });
  });

  describe('count', () => {
    it('shoud be defined', () => {
      expect(service.count).toBeDefined();
    });

    it('should count all teams', async () => {
      jest.spyOn(teamRepository, 'countBy').mockResolvedValue(2);

      await expect(service.count()).resolves.toEqual(2);
      expect(teamRepository.countBy).toHaveBeenCalledWith({
        region: { id: undefined },
      });
    });

    it('should count teams based on the provided regions IDs', async () => {
      jest.spyOn(teamRepository, 'countBy').mockResolvedValue(2);

      await expect(service.count([1, 2])).resolves.toEqual(2);
      expect(teamRepository.countBy).toHaveBeenCalledWith({
        region: { id: In([1, 2]) },
      });
    });
  });

  describe('findOne', () => {
    const team = { id: 1 };

    beforeEach(() => {
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(team);
    });

    it('shoud be defined', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should retrieve a single team', async () => {
      await expect(service.findOne(1)).resolves.toEqual(team);

      expect(teamRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        region: undefined,
      });
    });

    it('should retrieve a single team filtrated by regions', async () => {
      await expect(service.findOne(1, [1, 2])).resolves.toEqual(team);

      expect(teamRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        region: { id: In([1, 2]) },
      });
    });
  });

  describe('update', () => {
    it('shoud be defined', () => {
      expect(service.update).toBeDefined();
    });

    // TODO: Add tests
  });

  describe('remove', () => {
    it('shoud be defined', () => {
      expect(service.remove).toBeDefined();
    });

    it('should throw an error if the team with the provided ID does not exist', async () => {
      await expect(service.remove(1)).rejects.toThrow(
        new NotFoundException(`Team with ID 1 not found`),
      );
    });

    it('should throw an error if the team cannot be removed', async () => {
      jest.spyOn(service, 'canRemove').mockResolvedValue(false);

      await expect(service.remove(1)).rejects.toThrow(
        new BadRequestException('Team cannot be removed'),
      );
    });

    it('should remove a team', async () => {
      jest.spyOn(service, 'canRemove').mockResolvedValue(true);

      await expect(service.remove(1)).resolves.toEqual(1);
    });
  });

  describe('canRemove', () => {
    it('shoud be defined', () => {
      expect(service.canRemove).toBeDefined();
    });

    it('should throw an error if the team with the provided ID does not exist', async () => {
      await expect(service.canRemove(1)).rejects.toThrow(
        new NotFoundException(`Team with ID 1 not found`),
      );
    });

    it('should return false, the team has users', async () => {
      const team = { id: 1, users: [{ id: 1 }] };
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(team);

      await expect(service.canRemove(team.id)).resolves.toBeFalsy();
    });

    it('should return false, the team has users, when ignore user', async () => {
      const team = { id: 1, users: [{ id: 1 }, { id: 2 }] };
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(team);

      await expect(service.canRemove(team.id, 1)).resolves.toBeFalsy();
    });

    it('should return true, the team has no users', async () => {
      const team = { id: 1, users: [] };
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(team);

      await expect(service.canRemove(team.id)).resolves.toBeTruthy();
    });

    it('should return true, the team has no users, when ignore user', async () => {
      const team = { id: 1, users: [{ id: 1 }] };
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(team);

      await expect(service.canRemove(team.id, 1)).resolves.toBeTruthy();
    });

    // TODO: Add tests for active rabbits
  });
});
