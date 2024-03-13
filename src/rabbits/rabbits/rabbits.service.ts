import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';

import { CreateRabbitInput } from '../dto/create-rabbit.input';
import { UpdateRabbitInput } from '../dto/update-rabbit.input';
import { Rabbit } from '../entities/rabbit.entity';

@Injectable()
export class RabbitsService {
  private readonly logger = new Logger(RabbitsService.name);

  constructor(
    @InjectRepository(Rabbit)
    private readonly rabbitRespository: Repository<Rabbit>,
    private readonly rabbitGroupsService: RabbitGroupsService,
  ) {}

  /**
   * Creates a new rabbit.
   * If `createRabbitInput.rabbitGroupId` is not provided,
   * it creates a new rabbit group and assigns the rabbit to it
   * (based on `createRabbitInput.regionId`)
   *
   * @param createRabbitInput - The input data for creating a rabbit.
   * @returns A Promise that resolves to the created rabbit.
   * @throws {BadRequestException} if the provided data is invalid.
   */
  async create(createRabbitInput: CreateRabbitInput): Promise<Rabbit> {
    if (!createRabbitInput.rabbitGroupId) {
      const rabbitGroup = await this.rabbitGroupsService.create(
        createRabbitInput.regionId,
      );
      createRabbitInput.rabbitGroupId = rabbitGroup.id;
    }

    try {
      const rabbit = await this.rabbitRespository.save({
        ...createRabbitInput,
        rabbitGroup: { id: createRabbitInput.rabbitGroupId },
      });

      this.logger.log(`Rabbit with id ${rabbit.id} has been created`);

      return rabbit;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(
          'Cannot create a rabbit with the provided data',
        );
      } else {
        throw error;
      }
    }
  }

  findAll() {
    // TODO: Implement this method
    return `This action returns all rabbits`;
  }

  /**
   * Finds a rabbit by its ID.
   *
   * @param id - The ID of the rabbit to find.
   * @returns A Promise that resolves to the found rabbit, or null if not found.
   */
  async findOne(id: number): Promise<Rabbit | null> {
    return await this.rabbitRespository.findOneBy({ id });
  }

  update(id: number, updateRabbitInput: UpdateRabbitInput) {
    // TODO: Implement this method
    return `This action updates a #${id} rabbit with ${JSON.stringify(updateRabbitInput)}`;
  }

  remove(id: number) {
    // TODO: Implement this method
    return `This action removes a #${id} rabbit`;
  }
}
