import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  userAdmin,
  userNoRoles,
  userRegionManager,
  userRegionManager2Regions,
  userRegionObserver,
  userRegionObserver2Regions,
  userVolunteer,
} from '../common/tests';
import { FirebaseAuthGuard } from '../common/modules/auth';

import { RabbitNote, VetVisit } from './entities';
import { Region } from '../common/modules/regions/entities';
import { Rabbit, RabbitGroup } from '../rabbits/entities';
import { User, Team } from '../users/entities';

import { RabbitNotesResolver } from './rabbit-notes.resolver';
import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitsAccessService } from '../rabbits';

describe('RabbitNotesResolver', () => {
  let resolver: RabbitNotesResolver;
  let rabbitNoteService: RabbitNotesService;
  let rabbitsAccessService: RabbitsAccessService;

  const rabbitNote = new RabbitNote({
    id: 1,
    description: 'This is a rabbit note',
    vetVisit: new VetVisit({ id: 1, date: new Date(), visitInfo: [] }),
    rabbit: new Rabbit({
      id: 1,
      rabbitGroup: new RabbitGroup({
        id: 1,
        team: new Team({ id: 1 }),
        region: new Region({ id: 1 }),
      }),
    }),
    user: new User({ id: 1, firebaseUid: '456' }),
  });

  const rabbitNoteWithDifferentUser = new RabbitNote({
    ...rabbitNote,
    user: new User({ id: 2, firebaseUid: '123' }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitNotesResolver,
        {
          provide: RabbitsAccessService,
          useValue: {
            validateAccess: jest.fn(() => true),
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

      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<RabbitNotesResolver>(RabbitNotesResolver);
    rabbitsAccessService =
      module.get<RabbitsAccessService>(RabbitsAccessService);
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

    it('should create a rabbit note with editAccess', async () => {
      await expect(
        resolver.createRabbitNote(userAdmin, createRabbitNoteInput),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledTimes(1);
    });

    it('should create a rabbit note with viewAccess', async () => {
      jest
        .spyOn(rabbitsAccessService, 'validateAccess')
        .mockResolvedValueOnce(false);

      await expect(
        resolver.createRabbitNote(userAdmin, {
          ...createRabbitNoteInput,
          vetVisit: undefined,
        }),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if user vith viewAccess tries to create note with vet visit', async () => {
      jest
        .spyOn(rabbitsAccessService, 'validateAccess')
        .mockResolvedValueOnce(false);

      await expect(
        resolver.createRabbitNote(userAdmin, createRabbitNoteInput),
      ).rejects.toThrow(
        new ForbiddenException('Region Observer cannot create vet visits'),
      );

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if the user is not allowed to create a note', async () => {
      jest
        .spyOn(rabbitsAccessService, 'validateAccess')
        .mockResolvedValue(false);

      await expect(
        resolver.createRabbitNote(userRegionObserver, createRabbitNoteInput),
      ).rejects.toThrow(
        new ForbiddenException('User is not allowed to create a note'),
      );

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledTimes(2);
    });
  });

  describe('findOne', () => {
    it('should be defined', () => {
      expect(resolver.findOne).toBeDefined();
    });

    it('should find a rabbit note - admin', async () => {
      await expect(resolver.findOne(userAdmin, '1')).resolves.toEqual(
        rabbitNote,
      );

      expect(rabbitNoteService.findOne).toHaveBeenCalledWith(1);
    });

    it('should find a rabbit note - region manager', async () => {
      await expect(
        resolver.findOne(userRegionManager2Regions, '1'),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitNoteService.findOne).toHaveBeenCalledWith(1, {
        withRegion: true,
        withUser: true,
      });
    });

    it('should find a rabbit note - region observer', async () => {
      await expect(
        resolver.findOne(userRegionObserver2Regions, '1'),
      ).resolves.toEqual(rabbitNote);

      expect(rabbitNoteService.findOne).toHaveBeenCalledWith(1, {
        withRegion: true,
        withUser: true,
      });
    });

    it('should find a rabbit note - volunteer', async () => {
      await expect(resolver.findOne(userVolunteer, '1')).resolves.toEqual(
        rabbitNote,
      );

      expect(rabbitNoteService.findOne).toHaveBeenCalledWith(1, {
        withRegion: true,
        withUser: true,
      });
    });

    it('should find a rabbit note - creator', async () => {
      jest
        .spyOn(rabbitNoteService, 'findOne')
        .mockResolvedValue(rabbitNoteWithDifferentUser);

      await expect(resolver.findOne(userNoRoles, '1')).resolves.toEqual(
        rabbitNoteWithDifferentUser,
      );

      expect(rabbitNoteService.findOne).toHaveBeenCalledWith(1, {
        withRegion: true,
        withUser: true,
      });
    });

    it('should throw an error if the user is not allowed to view the note', async () => {
      jest.spyOn(rabbitNoteService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userRegionObserver, '1')).rejects.toThrow(
        new ForbiddenException('User is not allowed to view the note'),
      );
    });

    it('should throw an error if rabbit note is not found - admin', async () => {
      jest.spyOn(rabbitNoteService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userAdmin, '1')).rejects.toThrow(
        new NotFoundException('Rabbit note not found'),
      );
    });

    it('should throw an error if rabbit note is not found - other', async () => {
      jest.spyOn(rabbitNoteService, 'findOne').mockResolvedValue(null);

      await expect(resolver.findOne(userNoRoles, '1')).rejects.toThrow(
        new ForbiddenException('User is not allowed to view the note'),
      );
    });
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
        new ForbiddenException('User is not allowed to edit the note'),
      );
    });

    it('should allow volunteer', async () => {
      jest
        .spyOn(rabbitNoteService, 'findOne')
        .mockResolvedValue(rabbitNoteWithDifferentUser);

      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userVolunteer, 1),
      ).resolves.toBeUndefined();
    });

    it('should allow region observer', async () => {
      jest
        .spyOn(rabbitNoteService, 'findOne')
        .mockResolvedValue(rabbitNoteWithDifferentUser);

      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userRegionObserver, 1),
      ).resolves.toBeUndefined();
    });

    it('should throw permission error when user cannot edit the note', async () => {
      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userRegionObserver, 1),
      ).rejects.toThrow(
        new ForbiddenException('User is not allowed to edit the note'),
      );
    });

    it('should throw permission error when RabbitNote is not found', async () => {
      jest.spyOn(rabbitNoteService, 'findOne').mockResolvedValue(null);

      await expect(
        // @ts-expect-error - testing private method
        resolver.validateEditAccess(userRegionObserver, 1),
      ).rejects.toThrow(
        new ForbiddenException('User is not allowed to edit the note'),
      );
    });
  });
});
