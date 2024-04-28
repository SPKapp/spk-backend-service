import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseAuthGuard } from '../common/modules/auth';
import {
  userAdmin,
  paginatedFields,
  paginatedFieldsWithTotalCount,
} from '../common/tests';

import { PaginatedRabbitNoteResolver } from './paginated-rabbit-note.resolver';
import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitsAccessService } from '../rabbits';

describe('PaginatedRabbitNoteResolver', () => {
  let resolver: PaginatedRabbitNoteResolver;
  let rabbitsAccessService: RabbitsAccessService;
  let rabbitNotesService: RabbitNotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatedRabbitNoteResolver,
        {
          provide: RabbitsAccessService,
          useValue: {
            validateAccess: jest.fn(),
          },
        },
        {
          provide: RabbitNotesService,
          useValue: {
            findAllPaginated: jest.fn(),
          },
        },
      ],
    })

      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<PaginatedRabbitNoteResolver>(
      PaginatedRabbitNoteResolver,
    );
    rabbitsAccessService =
      module.get<RabbitsAccessService>(RabbitsAccessService);
    rabbitNotesService = module.get<RabbitNotesService>(RabbitNotesService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(() => {
      jest
        .spyOn(rabbitsAccessService, 'validateAccess')
        .mockResolvedValue(true);
    });

    it('should be defined', () => {
      expect(resolver.findAll).toBeDefined();
    });

    it('should call without filtering', async () => {
      const args = { rabbitId: 1, offset: 0, limit: 10 };

      await resolver.findAll(userAdmin, paginatedFields, args);

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledWith(
        args.rabbitId,
        userAdmin,
      );
      expect(rabbitNotesService.findAllPaginated).toHaveBeenCalledWith(
        args.rabbitId,
        {
          offset: args.offset,
          limit: args.limit,
        },
        false,
      );
    });

    it('should call with isVetVisit', async () => {
      const args = { rabbitId: 1, offset: 0, limit: 10, isVetVisit: true };

      await resolver.findAll(userAdmin, paginatedFields, args);

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledWith(
        args.rabbitId,
        userAdmin,
      );
      expect(rabbitNotesService.findAllPaginated).toHaveBeenCalledWith(
        args.rabbitId,
        {
          offset: args.offset,
          limit: args.limit,
          vetVisit: true,
        },
        false,
      );
    });

    it('should call with vetVisit', async () => {
      const args = {
        rabbitId: 1,
        offset: 0,
        limit: 10,
        vetVisit: { dateFrom: new Date() },
      };

      await resolver.findAll(userAdmin, paginatedFields, args);

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledWith(
        args.rabbitId,
        userAdmin,
      );
      expect(rabbitNotesService.findAllPaginated).toHaveBeenCalledWith(
        args.rabbitId,
        {
          offset: args.offset,
          limit: args.limit,
          vetVisit: args.vetVisit,
        },
        false,
      );
    });

    it('should call with vetVisit and isVetVisit', async () => {
      const args = {
        rabbitId: 1,
        offset: 0,
        limit: 10,
        vetVisit: { dateFrom: new Date() },
        isVetVisit: true,
      };

      await resolver.findAll(userAdmin, paginatedFields, args);

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledWith(
        args.rabbitId,
        userAdmin,
      );
      expect(rabbitNotesService.findAllPaginated).toHaveBeenCalledWith(
        args.rabbitId,
        {
          offset: args.offset,
          limit: args.limit,
          vetVisit: args.vetVisit,
        },
        false,
      );
    });

    it('should call with standard filtering', async () => {
      const args = {
        rabbitId: 1,
        offset: 0,
        limit: 10,
        createdAtFrom: new Date(),
        createdAtTo: new Date(),
        withWeight: true,
      };

      await resolver.findAll(userAdmin, paginatedFields, args);

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledWith(
        args.rabbitId,
        userAdmin,
      );
      expect(rabbitNotesService.findAllPaginated).toHaveBeenCalledWith(
        args.rabbitId,
        {
          offset: args.offset,
          limit: args.limit,
          createdAtFrom: args.createdAtFrom,
          createdAtTo: args.createdAtTo,
          withWeight: args.withWeight,
        },
        false,
      );
    });

    it('should call with total count', async () => {
      const args = { rabbitId: 1, offset: 0, limit: 10 };

      await resolver.findAll(userAdmin, paginatedFieldsWithTotalCount, args);

      expect(rabbitsAccessService.validateAccess).toHaveBeenCalledWith(
        args.rabbitId,
        userAdmin,
      );
      expect(rabbitNotesService.findAllPaginated).toHaveBeenCalledWith(
        args.rabbitId,
        {
          offset: args.offset,
          limit: args.limit,
        },
        true,
      );
    });

    it('should call with createdBy filtering', async () => {
      jest
        .spyOn(rabbitsAccessService, 'validateAccess')
        .mockResolvedValue(false);

      const args = { rabbitId: 1, offset: 0, limit: 10 };

      await resolver.findAll(userAdmin, paginatedFields, args);

      expect(rabbitNotesService.findAllPaginated).toHaveBeenCalledWith(
        args.rabbitId,
        {
          offset: args.offset,
          limit: args.limit,
          createdBy: [userAdmin.id],
        },
        false,
      );
    });
  });
});
