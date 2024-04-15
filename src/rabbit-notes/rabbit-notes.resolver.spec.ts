import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import {
  userAdmin,
  userRegionManager,
  userRegionManager2Regions,
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

import { VetVisit } from './entities/vet-visit.entity';
import { RabbitNote } from './entities/rabbit-note.entity';
import { Region } from '../common/modules/regions/entities/region.entity';
import { RabbitGroup } from '../rabbits/entities/rabbit-group.entity';
import { Rabbit } from '../rabbits/entities/rabbit.entity';
import { User } from '../users/entities/user.entity';

describe('RabbitNotesResolver', () => {
  let resolver: RabbitNotesResolver;
  let rabbitNoteService: RabbitNotesService;
  let rabbitsService: RabbitsService;

  const rabbitNote = new RabbitNote({
    id: 1,
    description: 'This is a rabbit note',
    vetVisit: new VetVisit({ id: 1, date: new Date(), visitInfo: [] }),
    rabbit: new Rabbit({
      id: 1,
      rabbitGroup: new RabbitGroup({ id: 1, region: new Region({ id: 1 }) }),
    }),
    user: new User({ id: 1, firebaseUid: '123' }),
  });

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
            findOne: jest.fn(() => rabbitNote),
            update: jest.fn(() => rabbitNote),
            remove: jest.fn(),
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
    rabbitNoteService = module.get<RabbitNotesService>(RabbitNotesService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createRabbitNote', () => {
    const createRabbitNoteInput = {
      rabbitId: 1,
      description: 'This is a new rabbit note',
      vetVisit: { date: new Date(), visitInfo: [] },
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
        resolver.createRabbitNote(userRegionObserver, createRabbitNoteInput),
      ).rejects.toThrow(
        new ForbiddenException('Region Observer cannot create vet visits'),
      );
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(resolver.findAll).toBeDefined();
    });

    // TODO: Add tests for findAll
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    // TODO: Add tests for findOne
  });

  describe('updateRabbitNote', () => {
    const updateRabbitNoteInput = {
      id: rabbitNote.id,
      description: rabbitNote.description,
      vetVisit: { date: rabbitNote.vetVisit.date },
    };
    let verifyEditAccessSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.spyOn(rabbitNoteService, 'findOne').mockResolvedValue(rabbitNote);
      // @ts-expect-error - testing private method
      verifyEditAccessSpy = jest.spyOn(resolver, 'validateEditAccess');
    });

    it('should be defined', () => {
      expect(resolver.updateRabbitNote).toBeDefined();
    });

    it('should update a rabbit note', async () => {
      await expect(
        resolver.updateRabbitNote(userAdmin, updateRabbitNoteInput),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitNoteService.update).toHaveBeenCalledWith(
        rabbitNote.id,
        updateRabbitNoteInput,
      );

      expect(verifyEditAccessSpy).toHaveBeenCalledWith(userAdmin, 1);
    });
  });

  describe('removeRabbitNote', () => {
    let verifyEditAccessSpy: jest.SpyInstance;

    beforeEach(() => {
      // @ts-expect-error - testing private method
      verifyEditAccessSpy = jest.spyOn(resolver, 'validateEditAccess');
    });

    it('should be defined', () => {
      expect(resolver.removeRabbitNote).toBeDefined();
    });

    it('should remove a rabbit note', async () => {
      await expect(resolver.removeRabbitNote(userAdmin, '1')).resolves.toEqual({
        id: 1,
      });

      expect(rabbitNoteService.remove).toHaveBeenCalledWith(1);
      expect(verifyEditAccessSpy).toHaveBeenCalledWith(userAdmin, 1);
    });
  });

  describe('validateEditAccess', () => {
    it('should be defined', () => {
      // @ts-expect-error - testing private method
      expect(resolver.validateEditAccess).toBeDefined();
    });

    it('should allow admin', async () => {
      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userAdmin, 1),
      ).resolves.toBeUndefined();
    });

    it('should allow region manager', async () => {
      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userRegionManager2Regions, 1),
      ).resolves.toBeUndefined();
    });

    it('should throw permission error when region manager does not have access to the region', async () => {
      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userRegionManager, 1),
      ).rejects.toThrow(
        new ForbiddenException('User is not allowed to update the note'),
      );
    });

    it('should allow volunteer', async () => {
      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userVolunteer, 1),
      ).resolves.toBeUndefined();
    });

    it('should allow region observer', async () => {
      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userRegionObserver, 1),
      ).resolves.toBeUndefined();
    });

    it('should throw permission error when user cannot edit the note', async () => {
      jest.spyOn(rabbitNoteService, 'findOne').mockResolvedValue({
        ...rabbitNote,
        user: new User({ id: 2, firebaseUid: '456' }),
      });

      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userRegionObserver, 1),
      ).rejects.toThrow(
        new ForbiddenException('User is not allowed to update the note'),
      );
    });

    it('should throw permission error when RabbitNote is not found', async () => {
      jest.spyOn(rabbitNoteService, 'findOne').mockResolvedValue(null);

      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userRegionObserver, 1),
      ).rejects.toThrow(
        new ForbiddenException('User is not allowed to update the note'),
      );
    });
  });
});
