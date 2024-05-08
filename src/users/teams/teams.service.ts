import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindManyOptions,
  ILike,
  In,
  Not,
  Repository,
} from 'typeorm';

import { RegionsService } from '../../common/modules/regions';
import { Team, User } from '../entities';
import { PaginatedTeams, TeamsFilters } from '../dto';
import { RabbitGroup, RabbitGroupStatus } from '../../rabbits/entities';

@Injectable()
export class TeamsService {
  logger = new Logger(TeamsService.name);

  constructor(
    @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
    @Inject(forwardRef(() => RegionsService))
    private readonly regionsService: RegionsService,
    private dataSource: DataSource,
  ) {}

  /**
   * Creates a new active team based on the provided region ID.
   *
   * @param regionId - The ID of the region for the team.
   * @returns A Promise that resolves to the created team.
   * @throws {BadRequestException} if the region with the provided ID does not exist.
   */
  async create(regionId: number): Promise<Team> {
    const region = await this.regionsService.findOne(regionId);
    if (!region) {
      throw new BadRequestException(
        'Region with the provided id does not exist',
      );
    }

    return await this.teamRepository.save(new Team({ region }));
  }

  /**
   * Retrieves paginated teams based on the provided filters.
   *
   * @param filters - The filters to apply to the teams.
   * @param totalCount - Whether to include the total count of teams.
   * @returns A Promise that resolves to a PaginatedTeams object containing the paginated teams.
   */
  async findAllPaginated(
    filters: TeamsFilters = {},
    totalCount: boolean = false,
  ): Promise<PaginatedTeams> {
    filters.offset ??= 0;
    filters.limit ??= 10;

    const options = this.createFilterOptions(filters);

    return {
      data: await this.teamRepository.find(options),
      offset: filters.offset,
      limit: filters.limit,
      totalCount: totalCount
        ? await this.teamRepository.countBy(options.where)
        : undefined,
    };
  }

  /**
   * Retrieves all teams based on the provided filters.
   *
   * @param filters - The filters to apply to the teams.
   * @returns A Promise that resolves to an array of Team objects.
   */
  async findAll(filters: TeamsFilters = {}): Promise<Team[]> {
    return await this.teamRepository.find(this.createFilterOptions(filters));
  }

  private createFilterOptions(
    filters: TeamsFilters = {},
  ): FindManyOptions<Team> {
    return {
      skip: filters.offset,
      take: filters.limit,
      relations: {
        region: true,
        users: {
          roles: true,
        },
      },
      where: {
        region: { id: filters.regionsIds ? In(filters.regionsIds) : undefined },
        users: {
          active: filters.isActive,
          fullName: filters.name ? ILike(`%${filters.name}%`) : undefined,
        },
      },
    };
  }

  /**
   * Retrieves a single team from the database by its ID.
   *
   * @param id - The ID of the team to retrieve.
   * @param regionsIds - Optional array of region IDs to filter the team by.
   * @returns A promise that resolves to a Team object, or null if not found.
   */
  async findOne(id: number, regionsIds?: number[]): Promise<Team | null> {
    return await this.teamRepository.findOneBy({
      id,
      region: regionsIds ? { id: In(regionsIds) } : undefined,
    });
  }

  /**
   * Try to deactivate or remove a team by its ID.
   *
   * If the team has active users, nothing happens.
   * If the team hasn't active users, but has active RabbitGroups, the team cannot be deactivated. - throw BadRequestException
   * If the team hasn't active users and hasn't active RabbitGroups, the team is deactivated.
   * If the team hasn't active users, hasn't any RabbitGroups, the team is removed.
   *
   * @param TeamOrId - The team or ID of the team to deactivate.
   * @returns A Promise that resolves to void.
   * @throws {NotFoundException} if the team with the provided ID does not exist.
   * @throws {BadRequestException} if the team with the provided ID cannot be deactivated.
   */
  async maybeDeactivate(TeamOrId: number | Team): Promise<void> {
    let team: Team;
    if (TeamOrId instanceof Team) {
      team = TeamOrId;
    } else {
      team = await this.teamRepository.findOneBy({ id: TeamOrId });
      if (!team) {
        throw new NotFoundException(`Team with the provided id not found.`);
      }
    }

    const activeUsers = await this.dataSource.manager.countBy(User, {
      team: { id: team.id },
      active: true,
    });

    if (activeUsers) {
      return;
    }

    const activeGroups = await this.dataSource.manager.countBy(RabbitGroup, {
      team: { id: team.id },
      status: Not(RabbitGroupStatus.Inactive),
    });

    if (activeGroups !== 0) {
      throw new BadRequestException('Team cannot be deactivated');
    }

    const inactiveGroups = await this.dataSource.manager.countBy(RabbitGroup, {
      team: { id: team.id },
      status: RabbitGroupStatus.Inactive,
    });

    if (inactiveGroups !== 0 || (await team.users).length !== 0) {
      team.active = false;
      await this.teamRepository.save(team);

      this.logger.log(`Deactivating team with ID ${team.id}`);
    } else {
      const id = team.id;
      await this.teamRepository.remove(team);
      this.logger.log(`Removing team with ID ${id}`);
    }
  }
}
