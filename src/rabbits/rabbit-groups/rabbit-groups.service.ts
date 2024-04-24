import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Repository } from 'typeorm';

import { RabbitGroup } from '../entities';
import { RabbitGroupsFilters, PaginatedRabbitGroups } from '../dto';

import { TeamsService } from '../../users/teams/teams.service';

@Injectable()
export class RabbitGroupsService {
  private readonly logger = new Logger(RabbitGroupsService.name);

  constructor(
    @InjectRepository(RabbitGroup)
    private readonly rabbitGroupRespository: Repository<RabbitGroup>,
    private readonly teamsService: TeamsService,
  ) {}

  /**
   * Creates a new rabbit group.
   *
   * @param regionId - The ID of the region to assign to the rabbit group.
   * @returns A Promise that resolves to the created rabbit group.
   */
  async create(regionId: number): Promise<RabbitGroup> {
    return await this.rabbitGroupRespository.save({
      region: { id: regionId },
    });
  }

  /**
   * Retrieves paginated rabbit groups.
   *
   * @param filters - The filters to apply to the rabbit groups.
   * @param totalCount - Whether to include the total count of rabbit groups.
   * @returns A Promise that resolves to a PaginatedRabbitGroups object containing the paginated rabbit groups.
   */
  async findAllPaginated(
    filters: RabbitGroupsFilters = {},
    totalCount: boolean = false,
  ): Promise<PaginatedRabbitGroups> {
    filters.offset ??= 0;
    filters.limit ??= 10;

    const options = this.createFilterOptions(filters);

    return {
      data: await this.rabbitGroupRespository.find(options),
      offset: filters.offset,
      limit: filters.limit,
      totalCount: totalCount
        ? await this.rabbitGroupRespository.countBy(options.where)
        : undefined,
    };
  }

  /**
   * Retrieves all rabbit groups based on the provided parameters.
   *
   * @param filters - The filters to apply to the rabbit groups.
   * @returns A promise that resolves to an array of RabbitGroup objects.
   */
  async findAll(filters: RabbitGroupsFilters = {}): Promise<RabbitGroup[]> {
    return await this.rabbitGroupRespository.find(
      this.createFilterOptions(filters),
    );
  }

  private createFilterOptions(
    filters: RabbitGroupsFilters = {},
  ): FindManyOptions<RabbitGroup> {
    return {
      skip: filters.offset,
      take: filters.limit,
      where: {
        region: { id: filters.regionsIds ? In(filters.regionsIds) : undefined },
        team: { id: filters.teamIds ? In(filters.teamIds) : undefined },
      },
    };
  }

  /**
   * Finds a rabbit group by its ID.
   *
   * @param id - The ID of the rabbit group to find.
   * @param regionsIds - An optional array of region IDs to filter the rabbit groups.
   * @param teamsIds - An optional array of team IDs to filter the rabbit groups.
   * @returns A Promise that resolves to the found rabbit group, or null if not found.
   */
  async findOne(
    id: number,
    regionsIds?: number[],
    teamsIds?: number[],
  ): Promise<RabbitGroup | null> {
    return await this.rabbitGroupRespository.findOneBy({
      id,
      region: { id: regionsIds ? In(regionsIds) : undefined },
      team: { id: teamsIds ? In(teamsIds) : undefined },
    });
  }

  update(id: number) {
    throw new NotImplementedException(
      'For now, is nothing to update, in future fields will be added',
    );
    return `This action updates a #${id} rabbitGroup`;
  }

  /**
   * Removes a rabbit group by its ID.
   * If `regionsIds` is provided, only removes the rabbit group if it belongs to the specified regions.
   *
   * @param id - The ID of the rabbit group to remove.
   * @param regionsIds - Optional. An array of region IDs to filter the rabbit group by.
   * @returns The ID of the removed rabbit group.
   * @throws {NotFoundException} if the rabbit group is not found.
   * @throws {BadRequestException} if the rabbit group has rabbits assigned to it.
   */
  async remove(id: number, regionsIds?: number[]): Promise<number> {
    const rabbitGroup = await this.rabbitGroupRespository.findOneBy({
      id,
      region: { id: regionsIds ? In(regionsIds) : undefined },
    });
    if (!rabbitGroup) {
      throw new NotFoundException('Rabbit Group not found');
    }

    if ((await rabbitGroup.rabbits).length > 0) {
      throw new BadRequestException(
        'Cannot delete a rabbit group with rabbits assigned to it',
      );
    }

    await this.rabbitGroupRespository.softRemove(rabbitGroup);

    return id;
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
  async updateTeam(
    id: number,
    teamId: number,
    regionsIds?: number[],
  ): Promise<RabbitGroup> {
    const rabbitGroup = await this.rabbitGroupRespository.findOneBy({
      id,
      region: { id: regionsIds ? In(regionsIds) : undefined },
    });
    if (!rabbitGroup) {
      throw new NotFoundException('Rabbit Group not found');
    }

    const team = await this.teamsService.findOne(teamId, regionsIds);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    if (!team.active) {
      throw new BadRequestException('Team is not active');
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
