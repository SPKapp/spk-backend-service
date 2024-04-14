import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitNote } from './entities/rabbit-note.entity';
import { VetVisit } from './entities/vet-visit.entity';

import { Rabbit } from '../rabbits/entities/rabbit.entity';
import { User } from '../users/entities/user.entity';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => jest.fn(),
}));

describe('RabbitNotesService', () => {
  let service: RabbitNotesService;
  let rabbitNoteRepository: Repository<RabbitNote>;
  let vetVisitsRepository: Repository<VetVisit>;

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
      visitInfo: [],
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitNotesService,
        {
          provide: getRepositoryToken(RabbitNote),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(VetVisit),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitNotesService>(RabbitNotesService);
    rabbitNoteRepository = module.get<Repository<RabbitNote>>(
      getRepositoryToken(RabbitNote),
    );
    vetVisitsRepository = module.get<Repository<VetVisit>>(
      getRepositoryToken(VetVisit),
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

      expect(vetVisitsRepository.save).not.toHaveBeenCalled();
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
});
