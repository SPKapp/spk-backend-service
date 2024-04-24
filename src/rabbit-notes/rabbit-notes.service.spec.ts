import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import { buildDateFilter } from '../common/functions/filter.functions';

import { RabbitNote, VetVisit, VisitInfo, VisitType } from './entities';
import { Rabbit } from '../rabbits/entities';
import { User } from '../users/entities';

import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitsService } from '../rabbits';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => jest.fn(),
}));

describe('RabbitNotesService', () => {
  let service: RabbitNotesService;
  let rabbitsService: RabbitsService;
  let rabbitNoteRepository: Repository<RabbitNote>;

  const rabbitNote = new RabbitNote({
    rabbit: new Rabbit({ id: 1 }),
    user: new User({ id: 1 }),
    description: 'Test description',
    weight: 1.5,
  });

  const rabbitNoteWithVetVisit = new RabbitNote({
    ...rabbitNote,
    vetVisit: new VetVisit({
      date: new Date(),
      visitInfo: [
        new VisitInfo({
          visitType: VisitType.Control,
          additionalInfo: 'Test additional info',
        }),
      ],
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitNotesService,
        {
          provide: RabbitsService,
          useValue: {
            updateRabbitNoteFields: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RabbitNote),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            countBy: jest.fn(),
            save: jest.fn((data) => data),
            softRemove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(VisitInfo),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitNotesService>(RabbitNotesService);
    rabbitsService = module.get<RabbitsService>(RabbitsService);
    rabbitNoteRepository = module.get<Repository<RabbitNote>>(
      getRepositoryToken(RabbitNote),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createRabbitNote = {
      rabbitId: rabbitNote.rabbit.id,
      description: rabbitNote.description,
      weight: rabbitNote.weight,
    };

    const createRabbitNoteWithVetVisit = {
      ...createRabbitNote,
      vetVisit: {
        date: rabbitNoteWithVetVisit.vetVisit.date,
        visitInfo: [
          {
            visitType: VisitType.Control,
            additionalInfo: 'Test additional info',
          },
        ],
      },
    };

    const userId = 1;

    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should create a rabbit note without a vet visit', async () => {
      jest.spyOn(rabbitNoteRepository, 'save').mockResolvedValue(rabbitNote);

      await expect(service.create(createRabbitNote, userId)).resolves.toEqual(
        rabbitNote,
      );

      expect(rabbitNoteRepository.save).toHaveBeenCalledWith({
        rabbit: { id: createRabbitNote.rabbitId },
        user: { id: userId },
        description: createRabbitNote.description,
        weight: createRabbitNote.weight,
      });
    });

    it('should create a rabbit note with a vet visit', async () => {
      jest
        .spyOn(rabbitNoteRepository, 'save')
        .mockResolvedValue(rabbitNoteWithVetVisit);

      await expect(
        service.create(createRabbitNoteWithVetVisit, userId),
      ).resolves.toEqual(rabbitNoteWithVetVisit);

      expect(rabbitNoteRepository.save).toHaveBeenCalledWith({
        rabbit: { id: createRabbitNote.rabbitId },
        user: { id: userId },
        description: createRabbitNote.description,
        weight: createRabbitNote.weight,
        vetVisit: createRabbitNoteWithVetVisit.vetVisit,
        sortDate: createRabbitNoteWithVetVisit.vetVisit.date,
      });
    });

    it('should throw an error when trying to add a vet visit without VisitInfo', async () => {
      jest.spyOn(rabbitNoteRepository, 'save').mockResolvedValue(
        new RabbitNote({
          ...rabbitNote,
          vetVisit: new VetVisit({
            date: new Date(),
            visitInfo: [],
          }),
        }),
      );

      await expect(
        service.create(
          {
            ...createRabbitNote,
            vetVisit: {
              date: rabbitNoteWithVetVisit.vetVisit.date,
              visitInfo: [],
            },
          },
          userId,
        ),
      ).rejects.toThrow(new BadRequestException('VisitInfo cannot be empty'));
    });
  });

  describe('findAllPaginated', () => {
    beforeEach(() => {
      jest.spyOn(rabbitNoteRepository, 'find').mockResolvedValue([rabbitNote]);
    });

    it('should be defined', () => {
      expect(service.findAllPaginated).toBeDefined();
    });

    it('should find with default offset and limit', async () => {
      await expect(service.findAllPaginated(1)).resolves.toEqual({
        data: [rabbitNote],
        offset: 0,
        limit: 10,
      });

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: { rabbit: { id: 1 }, user: {} },
        skip: 0,
        take: 10,
      });
    });

    it('should find with custom offset and limit', async () => {
      await expect(
        service.findAllPaginated(1, { offset: 5, limit: 15 }),
      ).resolves.toEqual({
        data: [rabbitNote],
        offset: 5,
        limit: 15,
      });

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: { rabbit: { id: 1 }, user: {} },
        skip: 5,
        take: 15,
      });
    });

    it('should find with additional filters', async () => {
      const filters = {
        createdAtFrom: new Date(),
        createdAtTo: new Date(),
        vetVisit: true,
      };
      await expect(service.findAllPaginated(1, filters)).resolves.toEqual({
        data: [rabbitNote],
        offset: 0,
        limit: 10,
      });

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: {
          rabbit: { id: 1 },
          user: {},
          createdAt: buildDateFilter(new Date(), new Date()),
          vetVisit: { id: Not(IsNull()) },
        },
        skip: 0,
        take: 10,
      });
    });

    it('should add total count to the response', async () => {
      jest.spyOn(rabbitNoteRepository, 'countBy').mockResolvedValue(1);

      await expect(
        service.findAllPaginated(1, undefined, true),
      ).resolves.toEqual({
        data: [rabbitNote],
        offset: 0,
        limit: 10,
        totalCount: 1,
      });

      expect(rabbitNoteRepository.countBy).toHaveBeenCalledWith({
        rabbit: { id: 1 },
        user: {},
      });
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      jest.spyOn(rabbitNoteRepository, 'find').mockResolvedValue([rabbitNote]);
    });

    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should find without additional filters', async () => {
      await expect(service.findAll(1)).resolves.toEqual([rabbitNote]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: { rabbit: { id: 1 }, user: {} },
      });
    });

    it('should find with offset and limit', async () => {
      await expect(
        service.findAll(1, { offset: 5, limit: 10 }),
      ).resolves.toEqual([rabbitNote]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: { rabbit: { id: 1 }, user: {} },
        skip: 5,
        take: 10,
      });
    });

    it('should find creation filters', async () => {
      await expect(
        service.findAll(1, {
          createdAtFrom: new Date(),
          createdAtTo: new Date(),
        }),
      ).resolves.toEqual([rabbitNote]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: {
          rabbit: { id: 1 },
          user: {},
          createdAt: buildDateFilter(new Date(), new Date()),
        },
      });
    });

    it('should find only notes without vet visits', async () => {
      await expect(service.findAll(1, { vetVisit: false })).resolves.toEqual([
        rabbitNote,
      ]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: { rabbit: { id: 1 }, user: {}, vetVisit: { id: IsNull() } },
      });
    });

    it('should find only notes with vet visits', async () => {
      await expect(service.findAll(1, { vetVisit: true })).resolves.toEqual([
        rabbitNote,
      ]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: { rabbit: { id: 1 }, user: {}, vetVisit: { id: Not(IsNull()) } },
      });
    });

    it('should find with vet visit filters', async () => {
      await expect(
        service.findAll(1, {
          vetVisit: {
            visitTypes: [VisitType.Control],
          },
        }),
      ).resolves.toEqual([rabbitNote]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: {
          rabbit: { id: 1 },
          user: {},
          vetVisit: {
            id: Not(IsNull()),
            visitInfo: {
              visitType: In([VisitType.Control]),
            },
          },
        },
      });
    });

    it('should find with vet visit date filter', async () => {
      await expect(
        service.findAll(1, {
          vetVisit: { dateFrom: new Date(), dateTo: new Date() },
        }),
      ).resolves.toEqual([rabbitNote]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: {
          rabbit: { id: 1 },
          user: {},
          vetVisit: {
            id: Not(IsNull()),
            date: buildDateFilter(new Date(), new Date()),
            visitInfo: {},
          },
        },
      });
    });

    it('should find with withWeight filter', async () => {
      await expect(service.findAll(1, { withWeight: true })).resolves.toEqual([
        rabbitNote,
      ]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: { rabbit: { id: 1 }, user: {}, weight: Not(IsNull()) },
      });
    });

    it('should find with createdBy filter', async () => {
      await expect(service.findAll(1, { createdBy: [1, 2] })).resolves.toEqual([
        rabbitNote,
      ]);

      expect(rabbitNoteRepository.find).toHaveBeenCalledWith({
        order: { sortDate: 'DESC' },
        where: { rabbit: { id: 1 }, user: { id: In([1, 2]) } },
      });
    });
  });

  describe('findOne', () => {
    beforeEach(() => {
      jest.spyOn(rabbitNoteRepository, 'findOne').mockResolvedValue(rabbitNote);
    });

    it('should be defined', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should find a rabbit note', async () => {
      await expect(service.findOne(rabbitNote.id)).resolves.toEqual(rabbitNote);

      expect(rabbitNoteRepository.findOne).toHaveBeenCalledWith({
        relations: {
          vetVisit: true,
        },
        where: { id: rabbitNote.id },
      });
    });

    it('should find a rabbit note with related rabbit', async () => {
      await expect(
        service.findOne(rabbitNote.id, {
          withRabbit: true,
        }),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitNoteRepository.findOne).toHaveBeenCalledWith({
        relations: {
          vetVisit: true,
          rabbit: true,
        },
        where: { id: rabbitNote.id },
      });
    });

    it('should find a rabbit note with related user', async () => {
      await expect(
        service.findOne(rabbitNote.id, {
          withUser: true,
        }),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitNoteRepository.findOne).toHaveBeenCalledWith({
        relations: {
          vetVisit: true,
          user: true,
        },
        where: { id: rabbitNote.id },
      });
    });

    it('should find a rabbit note with related region', async () => {
      await expect(
        service.findOne(rabbitNote.id, {
          withRegion: true,
        }),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitNoteRepository.findOne).toHaveBeenCalledWith({
        relations: {
          vetVisit: true,
          rabbit: {
            rabbitGroup: true,
          },
        },
        where: { id: rabbitNote.id },
      });
    });
  });

  describe('update', () => {
    const updateRabbitNote = {
      id: rabbitNote.id,
      weight: rabbitNote.weight + 2,
    };
    const updatedRabbitNote = new RabbitNote({
      ...rabbitNote,
      weight: updateRabbitNote.weight,
    });

    const updateRabbitNoteWithVetVisit = {
      ...updateRabbitNote,
      vetVisit: {
        date: new Date(2024, 1, 1),
        visitInfo: [
          new VisitInfo({
            visitType: VisitType.Control,
            additionalInfo: 'test',
          }),
        ],
      },
    };
    const updatedRabbitNoteWithVetVisit = new RabbitNote({
      ...updatedRabbitNote,
      sortDate: updateRabbitNoteWithVetVisit.vetVisit.date,
      vetVisit: {
        ...rabbitNoteWithVetVisit.vetVisit,
        date: updateRabbitNoteWithVetVisit.vetVisit.date,
        visitInfo: updateRabbitNoteWithVetVisit.vetVisit.visitInfo,
      },
    });

    it('should be defined', () => {
      expect(service.update).toBeDefined();
    });

    it('should update a rabbit note without a vet visit', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(rabbitNote);

      await expect(
        service.update(updateRabbitNote.id, updateRabbitNote),
      ).resolves.toEqual(updatedRabbitNote);

      expect(rabbitNoteRepository.save).toHaveBeenCalledWith({
        ...rabbitNote,
        weight: updateRabbitNote.weight,
      });
    });

    it('should update a rabbit note with a vet visit', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(rabbitNoteWithVetVisit);

      await expect(
        service.update(updateRabbitNote.id, updateRabbitNoteWithVetVisit),
      ).resolves.toEqual(updatedRabbitNoteWithVetVisit);

      expect(rabbitNoteRepository.save).toHaveBeenCalledWith(
        updatedRabbitNoteWithVetVisit,
      );
    });

    it('should throw an error when the rabbit note is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(updateRabbitNote.id, updateRabbitNote),
      ).rejects.toThrow(new NotFoundException('RabbitNote not found'));
    });

    it('should throw an error when trying to add a vet visit to a note without it', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(rabbitNote);

      await expect(
        service.update(updateRabbitNote.id, updateRabbitNoteWithVetVisit),
      ).rejects.toThrow(
        new BadRequestException(
          'VetVisit cannot be added to a note without it',
        ),
      );
    });

    it('should throw an error when trying to save a note without VisitInfo', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(rabbitNoteWithVetVisit);

      await expect(
        service.update(updateRabbitNote.id, {
          ...updateRabbitNote,
          vetVisit: {
            visitInfo: [],
          },
        }),
      ).rejects.toThrow(new BadRequestException('VisitInfo cannot be empty'));
    });
  });

  describe('remove', () => {
    it('should be defined', () => {
      expect(service.remove).toBeDefined();
    });

    it('should remove a rabbit note', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(rabbitNote);

      await expect(service.remove(rabbitNote.id)).resolves.toBeUndefined();

      expect(rabbitNoteRepository.softRemove).toHaveBeenCalledWith(rabbitNote);
    });

    it('should throw an error when the rabbit note is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(service.remove(rabbitNote.id)).rejects.toThrow(
        new NotFoundException('RabbitNote not found'),
      );

      expect(rabbitNoteRepository.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('updateRabbit', () => {
    it('should be defined', () => {
      // @ts-expect-error - test private method
      expect(service.updateRabbit).toBeDefined();
    });

    it('should update the rabbit', async () => {
      // @ts-expect-error - test private method
      await service.updateRabbit(rabbitNote.rabbit.id);

      expect(rabbitsService.updateRabbitNoteFields).toHaveBeenCalled();
    });
  });
});
