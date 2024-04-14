import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRabbitNoteInput } from './dto/create-rabbit-note.input';
import { UpdateRabbitNoteInput } from './dto/update-rabbit-note.input';
import { RabbitNote } from './entities/rabbit-note.entity';

@Injectable()
export class RabbitNotesService {
  private readonly logger = new Logger(RabbitNotesService.name);

  constructor(
    @InjectRepository(RabbitNote)
    private readonly rabbitNoteRepository: Repository<RabbitNote>,
  ) {}

  /**
   * Creates a new rabbit note.
   *
   * @param createRabbitNoteInput - The input data for creating the rabbit note.
   * @param userId - The ID of the user creating the rabbit note.
   * @returns The created rabbit note.
   */
  async create(createRabbitNoteInput: CreateRabbitNoteInput, userId: number) {
    return await this.rabbitNoteRepository.save({
      rabbit: { id: createRabbitNoteInput.rabbitId },
      user: { id: userId },
      ...createRabbitNoteInput,
      rabbitId: undefined,
    });
  }

  findAll() {
    return `This action returns all rabbitNotes`;
  }

  async findOne(id: number): Promise<RabbitNote | null> {
    return await this.rabbitNoteRepository.findOneBy({ id });
  }

  async update(id: number, updateRabbitNoteInput: UpdateRabbitNoteInput) {
    const rabbitNote = await this.rabbitNoteRepository.findOneBy({ id });

    rabbitNote.vetVisit.date = updateRabbitNoteInput.vetVisit.date;

    return await this.rabbitNoteRepository.save(rabbitNote);
  }

  remove(id: number) {
    return `This action removes a #${id} rabbitNote`;
  }
}
