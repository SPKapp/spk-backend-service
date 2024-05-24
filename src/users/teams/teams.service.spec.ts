import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';

import { RegionsService } from '../../common/modules/regions/regions.service';
import { TeamsService } from './teams.service';

import { Region } from '../../common/modules/regions/entities';
import { Team, User } from '../entities';
import { RabbitGroup, RabbitGroupStatusHelper } from '../../rabbits/entities';

describe('TeamsService', () => {
  let service: TeamsService;
  let regionsService: RegionsService;
  let teamRepository: Repository<Team>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RegionsService,
          useValue: {
            findOne: jest.fn(() => null),
          },
        },
        {
          provide: getRepositoryToken(Team),
          useValue: {
            find: jest.fn(),
            countBy: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(() => null),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            manager: {
              countBy: jest.fn(),
            },
          },
        },
        TeamsService,
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    regionsService = module.get<RegionsService>(RegionsService);
    teamRepository = module.get<Repository<Team>>(getRepositoryToken(Team));
    dataSource = module.get<DataSource>(DataSource);
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
      const team = new Team({
        id: 1,
        region: new Region(region),
      });
      jest
        .spyOn(regionsService, 'findOne')
        .mockResolvedValue(new Region(region));
      jest.spyOn(teamRepository, 'save').mockResolvedValue(team);

      await expect(service.create(1)).resolves.toEqual(team);
      expect(teamRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAllPaginated', () => {
    const teams = [new Team({ id: 1 }), new Team({ id: 2 })];

    beforeEach(() => {
      jest.spyOn(teamRepository, 'find').mockResolvedValue(teams);
      jest.spyOn(teamRepository, 'countBy').mockResolvedValue(2);
    });

    it('shoud be defined', () => {
      expect(service.findAllPaginated).toBeDefined();
    });

    it('should retrieve paginated teams', async () => {
      await expect(service.findAllPaginated()).resolves.toEqual({
        data: teams,
        offset: 0,
        limit: 10,
      });
    });

    it('should retrieve paginated teams with custom filters', async () => {
      await expect(
        service.findAllPaginated({ offset: 10, limit: 20 }, true),
      ).resolves.toEqual({
        data: teams,
        offset: 10,
        limit: 20,
        totalCount: 2,
      });
    });
  });

  describe('findAll', () => {
    const teams = [new Team({ id: 1 }), new Team({ id: 2 })];

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
        relations: {
          region: true,
          users: {
            roles: true,
          },
        },
        where: {
          region: { id: undefined },
          active: undefined,
        },
      });
    });

    it('should retrieve teams based on the provided regions IDs and isActive', async () => {
      await expect(
        service.findAll({
          regionsIds: [1, 2],
          isActive: true,
        }),
      ).resolves.toEqual(teams);

      expect(teamRepository.find).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        relations: {
          region: true,
          users: {
            roles: true,
          },
        },
        where: {
          region: { id: In([1, 2]) },
          active: true,
        },
      });
    });

    it('should retrieve teams based on the provided regions IDs and pagination params and fullname', async () => {
      await expect(
        service.findAll({
          offset: 0,
          limit: 10,
          regionsIds: [1, 2],
        }),
      ).resolves.toEqual(teams);

      expect(teamRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: {
          region: true,
          users: {
            roles: true,
          },
        },
        where: {
          region: { id: In([1, 2]) },
          active: undefined,
        },
      });
    });
  });

  describe('findOne', () => {
    const team = new Team({ id: 1 });

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

  describe('maybeDeactivate', () => {
    const team = new Team({ id: 1, active: true, users: Promise.resolve([]) });

    beforeEach(() => {
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(team);
    });

    it('shoud be defined', () => {
      expect(service.maybeDeactivate).toBeDefined();
    });

    it('should throw an error if the team does not exist', async () => {
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(null);
      await expect(service.maybeDeactivate(1)).rejects.toThrow(
        new NotFoundException('Team with the provided id not found.'),
      );
    });

    it('should remove a team without users and active rabbitGroups', async () => {
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);

      await service.maybeDeactivate({ ...team });

      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(1, User, {
        team: { id: team.id },
        active: true,
      });
      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(
        2,
        RabbitGroup,
        {
          team: { id: team.id },
          status: Not(In(RabbitGroupStatusHelper.Active)),
        },
      );
      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(
        3,
        RabbitGroup,
        {
          team: { id: team.id },
          status: Not(In(RabbitGroupStatusHelper.Archival)),
        },
      );

      expect(teamRepository.save).not.toHaveBeenCalled();
      expect(teamRepository.remove).toHaveBeenCalledWith(team);
    });

    it('should deactivate a team without active users and active rabbitGroups', async () => {
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);

      await service.maybeDeactivate(
        new Team({
          ...team,
          users: Promise.resolve([new User()]),
        }),
      );

      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(1, User, {
        team: { id: team.id },
        active: true,
      });
      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(
        2,
        RabbitGroup,
        {
          team: { id: team.id },
          status: Not(In(RabbitGroupStatusHelper.Active)),
        },
      );
      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(
        3,
        RabbitGroup,
        {
          team: { id: team.id },
          status: Not(In(RabbitGroupStatusHelper.Archival)),
        },
      );

      expect(teamRepository.save).toHaveBeenCalledWith({
        ...team,
        active: false,
      });
      expect(teamRepository.remove).not.toHaveBeenCalled();
    });

    it('should not deactivate a team with active users', async () => {
      jest.spyOn(teamRepository, 'findOneBy').mockResolvedValue(team);
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(1);

      await service.maybeDeactivate(1);

      expect(teamRepository.save).not.toHaveBeenCalled();
      expect(teamRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw an error if the team cannot be deactivated', async () => {
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(1);

      await expect(service.maybeDeactivate(1)).rejects.toThrow(
        new BadRequestException('Team cannot be deactivated'),
      );

      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(1, User, {
        team: { id: team.id },
        active: true,
      });
      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(
        2,
        RabbitGroup,
        {
          team: { id: team.id },
          status: Not(In(RabbitGroupStatusHelper.Active)),
        },
      );
      expect(dataSource.manager.countBy).toHaveBeenCalledTimes(2);

      expect(teamRepository.save).not.toHaveBeenCalled();
      expect(teamRepository.remove).not.toHaveBeenCalled();
    });

    it('should deactivate a team without active users and with inactive rabbitGroups', async () => {
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(0);
      jest.spyOn(dataSource.manager, 'countBy').mockResolvedValueOnce(1);

      await service.maybeDeactivate(1);

      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(1, User, {
        team: { id: team.id },
        active: true,
      });
      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(
        2,
        RabbitGroup,
        {
          team: { id: team.id },
          status: Not(In(RabbitGroupStatusHelper.Active)),
        },
      );
      expect(dataSource.manager.countBy).toHaveBeenNthCalledWith(
        3,
        RabbitGroup,
        {
          team: { id: team.id },
          status: Not(In(RabbitGroupStatusHelper.Archival)),
        },
      );

      expect(teamRepository.save).toHaveBeenCalledWith({
        ...team,
        active: false,
      });
      expect(teamRepository.remove).not.toHaveBeenCalled();
    });
  });
});
