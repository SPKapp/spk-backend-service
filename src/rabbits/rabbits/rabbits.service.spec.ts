import { Test, TestingModule } from '@nestjs/testing';

import { RabbitsService } from './rabbits.service';
import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';
import { Rabbit } from '../entities/rabbit.entity';
import { RabbitGroup } from '../entities/rabbit-group.entity';
import { AdmissionType } from '../entities/admissionType.enum';

describe('RabbitsService', () => {
  let service: RabbitsService;
  let rabbitGroupsService: RabbitGroupsService;
  let rabbitRepository: any;

  const rabbits = [
    new Rabbit({
      id: 1,
      name: 'Rabbit 1',
      admissionType: AdmissionType.Found,
      color: 'White',
      rabbitGroup: new RabbitGroup({ id: 1 }),
    }),
    new Rabbit({
      id: 1,
      name: 'Rabbit 1',
      rabbitGroup: new RabbitGroup({ id: 2 }),
    }),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitsService,
        {
          provide: RabbitGroupsService,
          useValue: {
            create: jest.fn(
              () => new RabbitGroup({ id: rabbits[0].rabbitGroup.id }),
            ),
          },
        },
        {
          provide: 'RabbitRepository',
          useValue: {
            save: jest.fn(() => rabbits[0]),
            findOneBy: jest.fn(() => rabbits[0]),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitsService>(RabbitsService);
    rabbitGroupsService = module.get<RabbitGroupsService>(RabbitGroupsService);
    rabbitRepository = module.get('RabbitRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should create a new rabbit, with new group', async () => {
      await expect(
        service.create({ ...rabbits[0], regionId: 1 }),
      ).resolves.toEqual(rabbits[0]);

      expect(rabbitGroupsService.create).toHaveBeenCalledWith(1);
    });

    it('should create a new rabbit, with existing group', async () => {
      await expect(
        service.create({ ...rabbits[0], rabbitGroupId: 1 }),
      ).resolves.toEqual(rabbits[0]);

      expect(rabbitGroupsService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    // TODO: Add tests
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should return a rabbit by id', () => {
      expect(service.findOne(1)).resolves.toEqual(rabbits[0]);
    });

    it('should return null', () => {
      jest.spyOn(rabbitRepository, 'findOneBy').mockResolvedValue(null);
      expect(service.findOne(1)).resolves.toBeNull();
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
