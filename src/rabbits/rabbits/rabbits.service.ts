import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';

import { CreateRabbitInput } from '../dto/create-rabbit.input';
import { UpdateRabbitInput } from '../dto/update-rabbit.input';
import { Rabbit } from '../entities/rabbit.entity';
import { RabbitGroup } from '../entities/rabbit-group.entity';

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

  async update(id: number, updateRabbitInput: UpdateRabbitInput) {
    // TODO: Implement this method
    const rabbit = await this.rabbitRespository.findOneBy({ id });
    if (!rabbit) {
      throw new NotFoundException('Rabbit not found');
    }

    // TODO: Add region update

    if (updateRabbitInput.name) {
      rabbit.name = updateRabbitInput.name;
    }
    if (updateRabbitInput.color) {
      rabbit.color = updateRabbitInput.color;
    }
    if (updateRabbitInput.breed) {
      rabbit.breed = updateRabbitInput.breed;
    }
    if (updateRabbitInput.gender) {
      rabbit.gender = updateRabbitInput.gender;
    }
    if (updateRabbitInput.birthDate) {
      rabbit.birthDate = updateRabbitInput.birthDate;
    }
    if (typeof updateRabbitInput.confirmedBirthDate === 'boolean') {
      rabbit.confirmedBirthDate = updateRabbitInput.confirmedBirthDate;
    }
    if (updateRabbitInput.admissionDate) {
      rabbit.admissionDate = updateRabbitInput.admissionDate;
    }
    if (updateRabbitInput.admissionType) {
      rabbit.admissionType = updateRabbitInput.admissionType;
    }
    if (updateRabbitInput.fillingDate) {
      rabbit.fillingDate = updateRabbitInput.fillingDate;
    }

    try {
      await this.rabbitRespository.save(rabbit);

      return rabbit;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(
          'Cannot update a rabbit with the provided data',
        );
      } else {
        throw error;
      }
    }
  }

  remove(id: number) {
    // TODO: Implement this method
    return `This action removes a #${id} rabbit`;
  }

  /**
   * Updates the rabbit group of a rabbit.
   * If `rabbitGroupId` is provided, the rabbit will be moved to the specified rabbit group.
   * If `rabbitGroupId` is not provided, a new rabbit group will be created in the same region as the rabbit.
   * @param id - The ID of the rabbit to update.
   * @param rabbitGroupId - The ID of the rabbit group to move the rabbit to, if not provided, new rabbit group will be created.
   * @param regionsIds - An array of region IDs to filter results by (optional).
   * @returns The updated rabbit.
   * @throws {NotFoundException} if the rabbit or rabbit group is not found.
   * @throws {BadRequestException} if the provided data is invalid.
   */
  @Transactional()
  async updateRabbitGroup(
    id: number,
    rabbitGroupId?: number,
    regionsIds?: number[],
  ) {
    const rabbit = await this.rabbitRespository.findOneBy({
      id,
      rabbitGroup: {
        region: { id: regionsIds ? In(regionsIds) : undefined },
      },
    });
    if (!rabbit) {
      throw new NotFoundException('Rabbit not found');
    }

    let rabbitGroup: RabbitGroup;
    if (!rabbitGroupId) {
      // Create a new rabbit group in the same region
      if ((await rabbit.rabbitGroup.rabbits).length === 1) {
        throw new BadRequestException(
          'Cannot create a new rabbit group if the current rabbit group has only one rabbit',
        );
      }

      rabbitGroup = await this.rabbitGroupsService.create(
        rabbit.rabbitGroup.region.id,
      );
    } else {
      rabbitGroup = await this.rabbitGroupsService.findOne(
        rabbitGroupId,
        regionsIds,
      );
      if (!rabbitGroup) {
        throw new NotFoundException('Rabbit Group not found');
      }
    }

    const oldRabbitGroup = rabbit.rabbitGroup;
    rabbit.rabbitGroup = rabbitGroup;

    try {
      await this.rabbitRespository.save(rabbit);

      if ((await oldRabbitGroup.rabbits).length === 0) {
        await this.rabbitGroupsService.remove(oldRabbitGroup.id);
      }

      return rabbit;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(
          'Cannot update a rabbit with the provided data',
        );
      } else {
        throw error;
      }
    }
  }
}
