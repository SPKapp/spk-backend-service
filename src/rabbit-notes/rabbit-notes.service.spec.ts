import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitNote } from './entities/rabbit-note.entity';
import { VetVisit } from './entities/vet-visit.entity';

import { Rabbit } from '../rabbits/entities/rabbit.entity';
import { User } from '../users/entities/user.entity';
import { RabbitsService } from '../rabbits/rabbits/rabbits.service';
import { VisitInfo } from './entities/visit-info.entity';
import { VisitType } from './entities/visit-type.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
            findOne: jest.fn(),
            findOneBy: jest.fn(),
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
      vetVisit: { date: rabbitNoteWithVetVisit.vetVisit.date, visitInfo: [] },
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
      });
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    // TODO: Add tests for findAll
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(service.findOne).toBeDefined();
    });

    // TODO: Add tests for findOne
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
      vetVisit: {
        ...rabbitNoteWithVetVisit.vetVisit,
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
