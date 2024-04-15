import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { CreateRabbitNoteInput } from './dto/create-rabbit-note.input';
import { UpdateRabbitNoteInput } from './dto/update-rabbit-note.input';
import { UpdateRabbitNoteFieldsDto } from '../rabbits/dto/update-rabbit-note-fields.input';
import { RabbitNote } from './entities/rabbit-note.entity';
import { RabbitsService } from '../rabbits/rabbits/rabbits.service';
import { VisitType } from './entities/visit-type.enum';
import { VisitInfo } from './entities/visit-info.entity';
import { Transactional } from 'typeorm-transactional';

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

  findAll() {
    return `This action returns all rabbitNotes`;
  }

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
            : false,
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
      for (const updateVisitInfo of updateRabbitNoteInput.vetVisit.visitInfo) {
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
