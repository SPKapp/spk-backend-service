import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { RabbitGroupsService } from '../rabbit-groups/rabbit-groups.service';

import {
  CreateRabbitInput,
  UpdateRabbitInput,
  UpdateRabbitNoteFieldsDto,
} from '../dto';
import { Rabbit, RabbitGroup } from '../entities';
import { EntityWithId } from '../../common/types';

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
   */
  @Transactional()
  async create(createRabbitInput: CreateRabbitInput): Promise<Rabbit> {
    if (!createRabbitInput.rabbitGroupId) {
      const rabbitGroup = await this.rabbitGroupsService.create(
        createRabbitInput.regionId,
      );
      createRabbitInput.rabbitGroupId = rabbitGroup.id;
    }

    const rabbit = await this.rabbitRespository.save({
      ...createRabbitInput,
      rabbitGroup: { id: createRabbitInput.rabbitGroupId },
    });

    this.logger.log(`Rabbit with id ${rabbit.id} has been created`);

    return rabbit;
  }

  /**
   * Finds a rabbit by its ID.
   *
   * @param id - The ID of the rabbit to find.
   * @param regionsIds - Optional array of region IDs to filter the region by.
   * @param teamsIds - Optional array of team IDs to filter the team by.
   * @returns A Promise that resolves to the found rabbit, or null if not found.
   */
  async findOne(
    id: number,
    regionsIds?: number[],
    teamsIds?: number[],
  ): Promise<Rabbit | null> {
    return await this.rabbitRespository.findOneBy({
      id,
      rabbitGroup: {
        region: { id: regionsIds ? In(regionsIds) : undefined },
        team: { id: teamsIds ? In(teamsIds) : undefined },
      },
    });
  }

  /**
   * Updates a rabbit with the provided data.
   * @param id - The ID of the rabbit to update.
   * @param updateRabbitInput - The data to update the rabbit with.
   * @param privileged - A boolean indicating if the user has privileged access.
   * @param regionsIds - Optional array of region IDs to filter the region by.
   * @param teamsIds - Optional array of team IDs to filter the team by.
   * @returns The updated rabbit.
   * @throws {NotFoundException} if the rabbit with the provided ID is not found.
   */
  async update(
    id: number,
    updateRabbitInput: UpdateRabbitInput,
    privileged: boolean,
    regionsIds?: number[],
    teamsIds?: number[],
  ) {
    const rabbit = await this.rabbitRespository.findOneBy({
      id,
      rabbitGroup: {
        region: { id: regionsIds ? In(regionsIds) : undefined },
        team: { id: teamsIds ? In(teamsIds) : undefined },
      },
    });
    if (!rabbit) {
      throw new NotFoundException('Rabbit not found');
    }

    rabbit.color = updateRabbitInput.color ?? rabbit.color;
    rabbit.breed = updateRabbitInput.breed ?? rabbit.breed;
    rabbit.gender = updateRabbitInput.gender ?? rabbit.gender;
    rabbit.birthDate = updateRabbitInput.birthDate ?? rabbit.birthDate;
    rabbit.confirmedBirthDate =
      updateRabbitInput.confirmedBirthDate ?? rabbit.confirmedBirthDate;
    rabbit.admissionDate =
      updateRabbitInput.admissionDate ?? rabbit.admissionDate;

    if (privileged) {
      rabbit.name = updateRabbitInput.name ?? rabbit.name;
      rabbit.fillingDate = updateRabbitInput.fillingDate ?? rabbit.fillingDate;
      rabbit.admissionType =
        updateRabbitInput.admissionType ?? rabbit.admissionType;
    }

    await this.rabbitRespository.save(rabbit);

    return rabbit;
  }

  @Transactional()
  async remove(id: number, regionsIds?: number[]): Promise<EntityWithId> {
    const rabbit = await this.rabbitRespository.findOneBy({
      id,
      rabbitGroup: {
        region: { id: regionsIds ? In(regionsIds) : undefined },
      },
    });
    if (!rabbit) {
      throw new NotFoundException('Rabbit not found');
    }

    const rabbitGroup = rabbit.rabbitGroup;

    // That should remove all related entities
    await this.rabbitRespository.softRemove(rabbit);

    if ((await rabbitGroup.rabbits).length === 0) {
      // That should remove all related entities
      await this.rabbitGroupsService.remove(rabbitGroup.id);
    }

    return { id };
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

    await this.rabbitRespository.save(rabbit);

    if ((await oldRabbitGroup.rabbits).length === 0) {
      await this.rabbitGroupsService.remove(oldRabbitGroup.id);
    }

    return rabbit;
  }

  async updateRabbitNoteFields(
    id: number,
    updateDto: UpdateRabbitNoteFieldsDto,
  ): Promise<void> {
    const rabbit = await this.rabbitRespository.findOneBy({
      id,
    });
    if (!rabbit) {
      throw new NotFoundException('Rabbit not found');
    }

    rabbit.weight = updateDto.weight ?? rabbit.weight;
    rabbit.chipNumber = updateDto.chipNumber ?? rabbit.chipNumber;
    rabbit.castrationDate = updateDto.castrationDate ?? rabbit.castrationDate;
    rabbit.dewormingDate = updateDto.dewormingDate ?? rabbit.dewormingDate;
    rabbit.vaccinationDate =
      updateDto.vaccinationDate ?? rabbit.vaccinationDate;

    await this.rabbitRespository.save(rabbit);
  }
}
