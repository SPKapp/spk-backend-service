import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';

import { RabbitGroup } from '../entities/rabbit-group.entity';
import { PaginatedRabbitGroups } from '../dto/paginated-rabbit-groups.output';
import { TeamsService } from '../../users/teams/teams.service';

@Injectable()
export class RabbitGroupsService {
  private readonly logger = new Logger(RabbitGroupsService.name);

  constructor(
    @InjectRepository(RabbitGroup)
    private readonly rabbitGroupRespository: Repository<RabbitGroup>,
    private readonly teamsService: TeamsService,
  ) {}

  async create(regionId: number) {
    // TODO: Implement this method
    try {
      return await this.rabbitGroupRespository.save({
        region: { id: regionId },
      });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(
          `Cannot create a rabbit group for the region with Id: ${regionId} `,
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Retrieves paginated rabbit groups.
   *
   * @param offset - The offset value for pagination. Defaults to 0.
   * @param limit - The limit value for pagination. Defaults to 10.
   * @param regionsIds - An optional array of region IDs to filter the results by.
   * @returns A Promise that resolves to a PaginatedRabbitGroups object containing the paginated rabbit groups.
   */
  async findAllPaginated(
    offset: number = 0,
    limit: number = 10,
    regionsIds?: number[],
  ): Promise<PaginatedRabbitGroups> {
    return {
      data: await this.findAll(regionsIds, offset, limit),
      offset,
      limit,
    };
  }

  /**
   * Retrieves all rabbit groups based on the provided parameters.
   *
   * @param regionsIds - An optional array of region IDs to filter the rabbit groups by.
   * @param offset - The number of records to skip before starting to return the records.
   * @param limit - The maximum number of records to return.
   * @returns A promise that resolves to an array of RabbitGroup objects.
   */
  async findAll(
    regionsIds?: number[],
    offset?: number,
    limit?: number,
  ): Promise<RabbitGroup[]> {
    return await this.rabbitGroupRespository.find({
      skip: offset,
      take: limit,
      where: { region: { id: regionsIds ? In(regionsIds) : undefined } },
    });
  }

  /**
   * Counts the number of rabbit groups based on the provided region IDs.
   * If no region IDs are provided, it counts all rabbit groups.
   *
   * @param regionsIds - An optional array of region IDs to filter the rabbit groups.
   * @returns A promise that resolves to the number of rabbit groups.
   */
  async count(regionsIds?: number[]): Promise<number> {
    return await this.rabbitGroupRespository.countBy({
      region: { id: regionsIds ? In(regionsIds) : undefined },
    });
  }

  /**
   * Finds a rabbit group by its ID.
   *
   * @param id - The ID of the rabbit group to find.
   * @returns A Promise that resolves to the found rabbit group, or null if not found.
   */
  async findOne(id: number): Promise<RabbitGroup | null> {
    return await this.rabbitGroupRespository.findOneBy({ id });
  }

  update(id: number) {
    // TODO: Implement this method
    return `This action updates a #${id} rabbitGroup`;
  }

  remove(id: number) {
    // TODO: Implement this method
    return `This action removes a #${id} rabbitGroup`;
  }

  /**
   * Updates the team of a rabbit group.
   *
   * @param id - The ID of the rabbit group.
   * @param teamId - The ID of the team to assign to the rabbit group.
   * @returns The updated rabbit group.
   * @throws {NotFoundException} if the rabbit group or team is not found.
   * @throws {BadRequestException} if the team is not active or the rabbit group has a different region than the team.
   */
  async updateTeam(id: number, teamId: number, regionsIds?: number[]) {
    const rabbitGroup = await this.rabbitGroupRespository.findOneBy({
      id,
      region: { id: regionsIds ? In(regionsIds) : undefined },
    });
    const team = await this.teamsService.findOne(teamId);

    if (!rabbitGroup) {
      throw new NotFoundException(`Rabbit Group with ID ${id} not found`);
    }
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }
    if (!team.active) {
      throw new BadRequestException(`Team with ID ${teamId} is not active`);
    }
    if (rabbitGroup.region.id !== team.region.id) {
      throw new BadRequestException(
        'The rabbit group has different region than the team',
      );
    }

    rabbitGroup.team = team;
    return await this.rabbitGroupRespository.save(rabbitGroup);
  }
}
