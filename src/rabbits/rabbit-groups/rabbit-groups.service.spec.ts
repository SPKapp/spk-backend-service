import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { ILike, In } from 'typeorm';

import { RabbitGroup } from '../entities';
import { Team } from '../../users/entities';
import { Region } from '../../common/modules/regions/entities';

import { TeamsService } from '../../users/teams/teams.service';
import { RabbitGroupsService } from './rabbit-groups.service';

describe('RabbitGroupsService', () => {
  let service: RabbitGroupsService;
  let rabbitGroupRepository: any;
  let teamsService: TeamsService;

  const rabbitGroups = [
    new RabbitGroup({
      id: 1,
      region: new Region({ id: 1 }),
      rabbits: new Promise((resolve) => resolve([])),
    }),
    new RabbitGroup({ id: 2, region: new Region({ id: 2 }) }),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitGroupsService,
        {
          provide: 'RabbitGroupRepository',
          useValue: {
            save: jest.fn((val) => val),
            find: jest.fn(() => rabbitGroups),
            countBy: jest.fn(() => rabbitGroups.length),
            findOneBy: jest.fn(() => rabbitGroups[0]),
            softRemove: jest.fn((group) => group.id),
          },
        },
        {
          provide: TeamsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitGroupsService>(RabbitGroupsService);
    rabbitGroupRepository = module.get('RabbitGroupRepository');
    teamsService = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should create a rabbit group', async () => {
      jest
        .spyOn(rabbitGroupRepository, 'save')
        .mockResolvedValue(rabbitGroups[0]);

      await expect(service.create(1)).resolves.toEqual(rabbitGroups[0]);

      expect(rabbitGroupRepository.save).toHaveBeenCalledWith({
        region: { id: 1 },
      });
    });
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

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: {
          region: true,
          team: true,
          rabbits: true,
        },
        where: {
          region: { id: undefined },
          team: { id: undefined },
          rabbits: { name: undefined },
        },
      });
    });

    it('should return a paginated list of rabbit groups with the specified offset and limit', async () => {
      const offset = 1;
      const limit = 1;

      await expect(
        service.findAllPaginated({ offset, limit }),
      ).resolves.toEqual({
        data: rabbitGroups,
        offset,
        limit,
      });

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: offset,
        take: limit,
        relations: {
          region: true,
          team: true,
          rabbits: true,
        },
        where: {
          region: { id: undefined },
          team: { id: undefined },
          rabbits: { name: undefined },
        },
      });
    });

    it('should return a paginated list with the total count of rabbit groups', async () => {
      await expect(service.findAllPaginated({}, true)).resolves.toEqual({
        data: rabbitGroups,
        offset: 0,
        limit: 10,
        totalCount: rabbitGroups.length,
      });

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: {
          region: true,
          team: true,
          rabbits: true,
        },
        where: {
          region: { id: undefined },
          team: { id: undefined },
          rabbits: { name: undefined },
        },
      });

      expect(rabbitGroupRepository.countBy).toHaveBeenCalledWith({
        region: { id: undefined },
        team: { id: undefined },
        rabbits: { name: undefined },
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
        relations: {
          region: true,
          team: true,
          rabbits: true,
        },
        where: {
          region: { id: undefined },
          team: { id: undefined },
          rabbits: { name: undefined },
        },
      });
    });

    it('should return a list of rabbit groups with the specified regions', async () => {
      const regionsIds = [1, 2];

      await expect(service.findAll({ regionsIds })).resolves.toEqual(
        rabbitGroups,
      );

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        relations: {
          region: true,
          team: true,
          rabbits: true,
        },
        where: {
          region: { id: In(regionsIds) },
          team: { id: undefined },
          rabbits: { name: undefined },
        },
      });
    });

    it('should return a list of rabbit groups with the specified teams', async () => {
      const teamIds = [1, 2];

      await expect(service.findAll({ teamIds })).resolves.toEqual(rabbitGroups);

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        relations: {
          region: true,
          team: true,
          rabbits: true,
        },
        where: {
          region: { id: undefined },
          team: { id: In(teamIds) },
          rabbits: { name: undefined },
        },
      });
    });

    it('should return a list of rabbit groups with the specified regions and teams', async () => {
      const regionsIds = [1, 2];
      const teamIds = [1, 2];

      await expect(service.findAll({ regionsIds, teamIds })).resolves.toEqual(
        rabbitGroups,
      );

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        relations: {
          region: true,
          team: true,
          rabbits: true,
        },
        where: {
          region: { id: In(regionsIds) },
          team: { id: In(teamIds) },
          rabbits: { name: undefined },
        },
      });
    });

    it('should return a list of rabbit groups with the specified rabbit name', async () => {
      const name = 'rabbit';

      await expect(service.findAll({ name })).resolves.toEqual(rabbitGroups);

      expect(rabbitGroupRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        relations: {
          region: true,
          team: true,
          rabbits: true,
        },
        where: {
          region: { id: undefined },
          team: { id: undefined },
          rabbits: { name: ILike(`%${name}%`) },
        },
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
        region: { id: undefined },
        team: { id: undefined },
      });
    });

    it('should return null if the rabbit group is not found', async () => {
      jest.spyOn(rabbitGroupRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findOne(1)).resolves.toBeNull();
      expect(rabbitGroupRepository.findOneBy).toHaveBeenCalledWith({
        id: rabbitGroups[0].id,
        region: { id: undefined },
        team: { id: undefined },
      });
    });

    it('should return a rabbit group with the specified regions', async () => {
      const regionsIds = [1, 2];

      await expect(
        service.findOne(rabbitGroups[0].id, regionsIds),
      ).resolves.toEqual(rabbitGroups[0]);

      expect(rabbitGroupRepository.findOneBy).toHaveBeenCalledWith({
        id: rabbitGroups[0].id,
        region: { id: In(regionsIds) },
        team: { id: undefined },
      });
    });

    it('should return a rabbit group with the specified teams', async () => {
      const teamIds = [1, 2];

      await expect(
        service.findOne(rabbitGroups[0].id, undefined, teamIds),
      ).resolves.toEqual(rabbitGroups[0]);

      expect(rabbitGroupRepository.findOneBy).toHaveBeenCalledWith({
        id: rabbitGroups[0].id,
        region: { id: undefined },
        team: { id: In(teamIds) },
      });
    });

    it('should return a rabbit group with the specified regions and teams', async () => {
      const regionsIds = [1, 2];
      const teamIds = [1, 2];

      await expect(
        service.findOne(rabbitGroups[0].id, regionsIds, teamIds),
      ).resolves.toEqual(rabbitGroups[0]);

      expect(rabbitGroupRepository.findOneBy).toHaveBeenCalledWith({
        id: rabbitGroups[0].id,
        region: { id: In(regionsIds) },
        team: { id: In(teamIds) },
      });
    });
  });

  describe('update', () => {
    it('should be defined', () => {
      expect(service.update).toBeDefined();
    });

    it('should throw a NotImplementedException', () => {
      expect(() => service.update(1)).toThrow(
        new NotImplementedException(
          'For now, is nothing to update, in future fields will be added',
        ),
      );
    });
  });

  describe('remove', () => {
    it('should be defined', () => {
      expect(service.remove).toBeDefined();
    });

    it('should remove a rabbit group', async () => {
      jest
        .spyOn(rabbitGroupRepository, 'findOneBy')
        .mockResolvedValue(rabbitGroups[0]);

      await expect(service.remove(rabbitGroups[0].id)).resolves.toEqual(
        rabbitGroups[0].id,
      );

      expect(rabbitGroupRepository.findOneBy).toHaveBeenCalledWith({
        id: rabbitGroups[0].id,
        region: { id: undefined },
      });
      expect(rabbitGroupRepository.softRemove).toHaveBeenCalledWith(
        rabbitGroups[0],
      );
    });

    it('should throw an error if the rabbit group is not found', async () => {
      jest.spyOn(rabbitGroupRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(
        new NotFoundException(`Rabbit Group not found`),
      );
    });

    it('should throw an error if the rabbit group has rabbits assigned to it', async () => {
      jest.spyOn(rabbitGroupRepository, 'findOneBy').mockResolvedValue({
        ...rabbitGroups[0],
        rabbits: [{}],
      });

      await expect(service.remove(rabbitGroups[0].id)).rejects.toThrow(
        new BadRequestException(
          `Cannot delete a rabbit group with rabbits assigned to it`,
        ),
      );
    });
  });

  describe('updateTeam', () => {
    it('should be defined', () => {
      expect(service.updateTeam).toBeDefined();
    });

    it('should update the team of a rabbit group', async () => {
      const team = new Team({
        id: 1,
        active: true,
        region: rabbitGroups[0].region,
      });
      const group = { ...rabbitGroups[0] };

      jest.spyOn(teamsService, 'findOne').mockResolvedValue(team);
      jest
        .spyOn(rabbitGroupRepository, 'findOneBy')
        .mockResolvedValue(rabbitGroups[0]);

      group.team = team;

      await expect(service.updateTeam(group.id, team.id)).resolves.toEqual(
        group,
      );

      expect(rabbitGroupRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        region: { id: undefined },
      });
    });

    it('should throw an error if the rabbit group is not found', async () => {
      jest.spyOn(rabbitGroupRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.updateTeam(1, 1)).rejects.toThrow(
        new NotFoundException(`Rabbit Group not found`),
      );
    });

    it('should throw an error if the team is not found', async () => {
      jest
        .spyOn(rabbitGroupRepository, 'findOneBy')
        .mockResolvedValue(rabbitGroups[0]);
      jest.spyOn(teamsService, 'findOne').mockResolvedValue(null);

      await expect(service.updateTeam(1, 1)).rejects.toThrow(
        new NotFoundException(`Team not found`),
      );
    });

    it('should throw an error if the team is not active', async () => {
      const team = new Team({ id: 1, active: false });

      jest.spyOn(teamsService, 'findOne').mockResolvedValue(team);
      jest
        .spyOn(rabbitGroupRepository, 'findOneBy')
        .mockResolvedValue(rabbitGroups[0]);

      await expect(service.updateTeam(1, 1)).rejects.toThrow(
        new BadRequestException(`Team is not active`),
      );
    });

    it('should throw an error if the rabbit group does not belong to the specified region', async () => {
      const team = new Team({ id: 1, active: true });

      jest.spyOn(teamsService, 'findOne').mockResolvedValue(team);
      jest.spyOn(rabbitGroupRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.updateTeam(1, 1, [1])).rejects.toThrow(
        new NotFoundException(`Rabbit Group not found`),
      );

      expect(rabbitGroupRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        region: { id: In([1]) },
      });
    });

    it('should throw an error if the rabbit group has different region than the team', async () => {
      const team = new Team({
        id: 1,
        active: true,
        region: new Region({ id: 2 }),
      });

      jest.spyOn(teamsService, 'findOne').mockResolvedValue(team);
      jest
        .spyOn(rabbitGroupRepository, 'findOneBy')
        .mockResolvedValue(rabbitGroups[0]);

      await expect(service.updateTeam(1, 1)).rejects.toThrow(
        new BadRequestException(
          `The rabbit group has different region than the team`,
        ),
      );
    });
  });
});
