import { Test, TestingModule } from '@nestjs/testing';

import {
  userAdmin,
  userRegionManager,
  userRegionObserver,
  userVolunteer,
} from '../common/tests/user-details.template';
import {
  FirebaseAuthGuard,
  getCurrentUserPipe,
} from '../common/modules/auth/auth.module';

import { RabbitNotesResolver } from './rabbit-notes.resolver';
import { RabbitNotesService } from './rabbit-notes.service';

import { RabbitsService } from '../rabbits/rabbits/rabbits.service';
import { ForbiddenException } from '@nestjs/common';

describe('RabbitNotesResolver', () => {
  let resolver: RabbitNotesResolver;
  // let rabbitNoteService: RabbitNotesService;
  let rabbitsService: RabbitsService;

  const rabbitNote = {
    id: 1,
    description: 'This is a rabbit note',
    vetVisit: { date: new Date() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitNotesResolver,
        RabbitNotesService,
        {
          provide: RabbitsService,
          useValue: {
            findOne: jest.fn(() => ({ id: 1 })),
          },
        },
        {
          provide: RabbitNotesService,
          useValue: {
            create: jest.fn(() => rabbitNote),
          },
        },
      ],
    })
      .overridePipe(getCurrentUserPipe)
      .useValue({ transform: jest.fn((currentUser) => currentUser) })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<RabbitNotesResolver>(RabbitNotesResolver);
    rabbitsService = module.get<RabbitsService>(RabbitsService);
    // rabbitNoteService = module.get<RabbitNotesService>(RabbitNotesService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createRabbitNote', () => {
    const createRabbitNoteInput = {
      rabbitId: 1,
      description: 'This is a new rabbit note',
      vetVisit: { date: new Date() },
    };

    it('should be defined', () => {
      expect(resolver.createRabbitNote).toBeDefined();
    });

    it('should create a rabbit note - admin', async () => {
      await expect(
        resolver.createRabbitNote(userAdmin, createRabbitNoteInput),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitsService.findOne).toHaveBeenCalledWith(
        1,
        undefined,
        undefined,
      );
    });

    it('should create a rabbit note - region manager', async () => {
      await expect(
        resolver.createRabbitNote(userRegionManager, createRabbitNoteInput),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitsService.findOne).toHaveBeenCalledWith(1, [2], undefined);
    });

    it('should create a rabbit note - volunteer', async () => {
      await expect(
        resolver.createRabbitNote(userVolunteer, createRabbitNoteInput),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitsService.findOne).toHaveBeenCalledWith(1, undefined, [1]);
    });

    it('should throw an error if the user is not allowed to create a vet visit', async () => {
      await expect(
        resolver.createRabbitNote(userRegionObserver, {
          ...createRabbitNoteInput,
          vetVisit: { date: new Date() },
        }),
      ).rejects.toThrow(
        new ForbiddenException('Region Observer cannot create vet visits'),
      );
    });
  });
});
