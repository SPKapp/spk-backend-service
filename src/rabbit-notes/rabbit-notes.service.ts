import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, IsNull, Not, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { buildDateFilter } from '../common/functions/filter.functions';

import {
  CreateRabbitNoteInput,
  UpdateRabbitNoteInput,
  PaginatedRabbitNotes,
  RabbitNotesFilters,
} from './dto';
import { RabbitNote, VisitInfo, VisitType } from './entities';

import { UpdateRabbitNoteFieldsDto } from '../rabbits/dto';
import { RabbitsService } from '../rabbits';

@Injectable()
export class RabbitNotesService {
  private readonly logger = new Logger(RabbitNotesService.name);

  constructor(
    @InjectRepository(RabbitNote)
    private readonly rabbitNoteRepository: Repository<RabbitNote>,
    @InjectRepository(VisitInfo)
    private readonly visitInfoRepository: Repository<VisitInfo>,
    private readonly rabbitsService: RabbitsService,
  ) {}

  /**
   * Creates a new rabbit note.
   *
   * @param createRabbitNoteInput - The input data for creating the rabbit note.
   * @param userId - The ID of the user creating the rabbit note.
   * @returns The created rabbit note.
   */
  @Transactional()
  async create(
    createRabbitNoteInput: CreateRabbitNoteInput,
    userId: number,
  ): Promise<RabbitNote> {
    if (
      createRabbitNoteInput.vetVisit &&
      createRabbitNoteInput.vetVisit.visitInfo.length === 0
    ) {
      throw new BadRequestException('VisitInfo cannot be empty');
    }

    const result = await this.rabbitNoteRepository.save({
      rabbit: { id: createRabbitNoteInput.rabbitId },
      user: { id: userId },
      ...createRabbitNoteInput,
      rabbitId: undefined,
    });

    // Recalculate the rabbit's fields based on the new rabbit note
    await this.updateRabbit(createRabbitNoteInput.rabbitId);

    return result;
  }

  /**
   * Retrieves paginated rabbit notes based on the provided filters.
   *
   * @param rabbitId - The ID of the rabbit.
   * @param filters - Optional filters to apply to the query.
   * @returns A Promise that resolves to a PaginatedRabbitNotes object containing the paginated rabbit notes.
   */
  async findAllPaginated(
    rabbitId: number,
    filters: RabbitNotesFilters = {},
    totalCount: boolean = false,
  ): Promise<PaginatedRabbitNotes> {
    filters.offset ??= 0;
    filters.limit ??= 10;

    const options = this.createFilterOptions(rabbitId, filters);

    return {
      data: await this.rabbitNoteRepository.find(options),
      offset: filters.offset,
      limit: filters.limit,
      totalCount: totalCount
        ? await this.rabbitNoteRepository.count(options)
        : undefined,
    };
  }

  /**
   * Retrieves all rabbit notes based on the provided filters.
   *
   * @param rabbitId - The ID of the rabbit.
   * @param filters - Optional filters to apply when retrieving the notes.
   * @returns A promise that resolves to an array of RabbitNote objects.
   */
  async findAll(
    rabbitId: number,
    filters: RabbitNotesFilters = {},
  ): Promise<RabbitNote[]> {
    return await this.rabbitNoteRepository.find(
      this.createFilterOptions(rabbitId, filters),
    );
  }

  private createFilterOptions(
    rabbitId: number,
    filters: RabbitNotesFilters = {},
  ): FindManyOptions<RabbitNote> {
    return {
      skip: filters.offset,
      take: filters.limit,
      where: {
        rabbit: { id: rabbitId },
        user: { id: filters.createdBy ? In(filters.createdBy) : undefined },
        createdAt: buildDateFilter(filters.createdAtFrom, filters.createdAtTo),
        weight: filters.withWeight ? Not(IsNull()) : undefined,
        vetVisit: (() => {
          switch (filters.vetVisit) {
            case true:
              return { id: Not(IsNull()) };
            case false:
              return { id: IsNull() };
            case undefined:
            case null:
              return undefined;
            default:
              return {
                id: Not(IsNull()),
                date: buildDateFilter(
                  filters.vetVisit.dateFrom,
                  filters.vetVisit.dateTo,
                ),
                visitInfo: {
                  visitType: filters.vetVisit.visitTypes
                    ? In(filters.vetVisit.visitTypes)
                    : undefined,
                },
              };
          }
        })(),
      },
    };
  }

  /**
   * Finds a RabbitNote by its ID.
   *
   * @param id - The ID of the RabbitNote to find.
   * @param params - Additional parameters for fetching related entities.
   * @returns A Promise that resolves to the found RabbitNote, or null if not found.
   */
  async findOne(
    id: number,
    params: {
      withRabbit?: boolean;
      withRegion?: boolean;
      withUser?: boolean;
    } = {},
  ): Promise<RabbitNote | null> {
    return await this.rabbitNoteRepository.findOne({
      relations: {
        vetVisit: true,
        user: params.withUser,
        rabbit:
          params.withRabbit || params.withRegion
            ? params.withRegion
              ? {
                  rabbitGroup: true,
                }
              : true
            : undefined,
      },
      where: { id },
    });
  }

  /**
   * Updates a RabbitNote with the specified ID.
   *
   * @param id - The ID of the RabbitNote to update.
   * @param updateRabbitNoteInput - The input data for updating the RabbitNote.
   * @returns A Promise that resolves to the updated RabbitNote.
   * @throws {NotFoundException} if the RabbitNote with the specified ID is not found.
   * @throws {BadRequestException} if a VetVisit is added to a RabbitNote without it.
   */
  @Transactional()
  async update(
    id: number,
    updateRabbitNoteInput: UpdateRabbitNoteInput,
  ): Promise<RabbitNote> {
    const rabbitNote = await this.findOne(id, { withRabbit: true });
    if (!rabbitNote) {
      throw new NotFoundException('RabbitNote not found');
    }

    // Update RabbitNote
    rabbitNote.description =
      updateRabbitNoteInput.description ?? rabbitNote.description;
    rabbitNote.weight = updateRabbitNoteInput.weight ?? rabbitNote.weight;
    // if dto weight is set to 0, it should be saved as null
    rabbitNote.weight = rabbitNote.weight === 0 ? null : rabbitNote.weight;

    // Update VetVisit
    if (!rabbitNote.vetVisit && updateRabbitNoteInput.vetVisit) {
      throw new BadRequestException(
        'VetVisit cannot be added to a note without it',
      );
    }
    if (rabbitNote.vetVisit) {
      rabbitNote.vetVisit.date =
        updateRabbitNoteInput.vetVisit.date ?? rabbitNote.vetVisit.date;

      // Update VisitInfo
      if (updateRabbitNoteInput.vetVisit.visitInfo) {
        for (const updateVisitInfo of updateRabbitNoteInput.vetVisit
          .visitInfo) {
          const oldVisitInfo = rabbitNote.vetVisit.visitInfo.find(
            (v) => v.visitType === updateVisitInfo.visitType,
          );

          if (oldVisitInfo) {
            oldVisitInfo.additionalInfo =
              updateVisitInfo.additionalInfo ?? oldVisitInfo.additionalInfo;
          } else {
            // @ts-expect-error - when no id is provided, the entity is created
            rabbitNote.vetVisit.visitInfo.push(updateVisitInfo);
          }
        }

        rabbitNote.vetVisit.visitInfo = rabbitNote.vetVisit.visitInfo.filter(
          (v) =>
            updateRabbitNoteInput.vetVisit.visitInfo.some(
              (u) => u.visitType === v.visitType,
            ),
        );

        if (rabbitNote.vetVisit.visitInfo.length === 0) {
          throw new BadRequestException('VisitInfo cannot be empty');
        }
      }
    }

    const result = await this.rabbitNoteRepository.save(rabbitNote);

    // Recalculate the rabbit's fields based on the new rabbit note
    await this.updateRabbit(rabbitNote.rabbit.id);

    return result;
  }

  /**
   * Removes a rabbit note by its ID.
   *
   * After removing the rabbit note, the corresponding rabbit's fields are recalculated.
   *
   * @param id - The ID of the rabbit note to remove.
   * @returns A Promise that resolves to void.
   * @throws {NotFoundException} if the rabbit note is not found.
   */
  @Transactional()
  async remove(id: number): Promise<void> {
    const rabbitNote = await this.findOne(id, { withRabbit: true });
    if (!rabbitNote) {
      throw new NotFoundException('RabbitNote not found');
    }

    const rabbitId = rabbitNote.rabbit.id;

    await this.rabbitNoteRepository.softRemove(rabbitNote);

    // Recalculate the rabbit's fields based on the new rabbit note
    await this.updateRabbit(rabbitId);
  }

  /**
   * Updates a rabbit's information based on the latest data from rabbit notes and vet visits.
   *
   * @param rabbitId - The ID of the rabbit to update.
   */
  @Transactional()
  private async updateRabbit(rabbitId: number) {
    const updateDto: UpdateRabbitNoteFieldsDto = {};

    // weight
    const weightFromVisits = await this.rabbitNoteRepository.findOne({
      relations: {
        vetVisit: true,
      },
      where: {
        rabbit: { id: rabbitId },
        vetVisit: { id: Not(IsNull()) },
        weight: Not(IsNull()),
      },
      order: {
        vetVisit: { date: 'DESC' },
      },
    });
    const weightFromNotes = await this.rabbitNoteRepository.findOne({
      where: {
        rabbit: { id: rabbitId },
        vetVisit: {
          id: IsNull(),
        },
        weight: Not(IsNull()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (weightFromVisits) {
      updateDto.weight = weightFromVisits.weight;
    }
    if (weightFromNotes?.createdAt > weightFromVisits?.vetVisit.date) {
      updateDto.weight = weightFromNotes.weight;
    }

    // chipNumber
    updateDto.chipNumber = (
      await this.visitInfoRepository.findOne({
        relations: {
          vetVisit: true,
        },
        where: {
          visitType: VisitType.Chip,
          vetVisit: { note: { rabbit: { id: rabbitId } } },
        },
        order: {
          vetVisit: { date: 'DESC' },
        },
      })
    )?.additionalInfo;

    // castrationDate
    updateDto.castrationDate = (
      await this.findByVisitType(rabbitId, VisitType.Castration)
    )?.vetVisit.date;

    // dewormingDate
    updateDto.dewormingDate = (
      await this.findByVisitType(rabbitId, VisitType.Deworming)
    )?.vetVisit.date;

    // vaccinationDate
    updateDto.vaccinationDate = (
      await this.findByVisitType(rabbitId, VisitType.Vaccination)
    )?.vetVisit.date;

    await this.rabbitsService.updateRabbitNoteFields(rabbitId, updateDto);
  }

  private async findByVisitType(
    rabbitId: number,
    visitType: VisitType,
  ): Promise<RabbitNote> {
    return await this.rabbitNoteRepository.findOne({
      relations: {
        vetVisit: true,
      },
      where: {
        rabbit: { id: rabbitId },
        vetVisit: {
          visitInfo: { visitType: visitType },
        },
      },
      order: {
        vetVisit: { date: 'DESC' },
      },
    });
  }
}
