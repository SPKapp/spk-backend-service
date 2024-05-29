import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, In, LessThan, Not, Repository } from 'typeorm';

import { CronConfig } from '../../config';
import { RabbitGroup, RabbitGroupStatus } from '../entities';
import {
  PaginatedRabbitGroups,
  UpdateRabbitGroupInput,
  FindRabbitGroupsArgs,
} from '../dto';

import { TeamsService } from '../../users/teams/teams.service';

import {
  NotificationAdoptionToConfirm,
  NotificationGroupAssigned,
  NotificationsService,
} from '../../notifications';

@Injectable()
export class RabbitGroupsService {
  private readonly logger = new Logger(RabbitGroupsService.name);

  constructor(
    @InjectRepository(RabbitGroup)
    private readonly rabbitGroupRespository: Repository<RabbitGroup>,
    private readonly teamsService: TeamsService,
    private readonly notificationsService: NotificationsService,
    @Inject(CronConfig.KEY)
    private readonly cronConfig: ConfigType<typeof CronConfig>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const job = new CronJob(
      this.cronConfig.checkAdoptionState,
      this.checkAdoptionState.bind(this),
    );
    this.schedulerRegistry.addCronJob('checkAdoptionState', job);
    job.start();
  }

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
    filters: FindRabbitGroupsArgs = new FindRabbitGroupsArgs(),
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
  async findAll(
    filters: FindRabbitGroupsArgs = new FindRabbitGroupsArgs(),
  ): Promise<RabbitGroup[]> {
    return await this.rabbitGroupRespository.find(
      this.createFilterOptions(filters),
    );
  }

  private createFilterOptions(
    filters: FindRabbitGroupsArgs = new FindRabbitGroupsArgs(),
  ): FindManyOptions<RabbitGroup> {
    return {
      skip: filters.offset,
      take: filters.limit,
      relations: {
        region: true,
        team: true,
        rabbits: true,
      },
      where: {
        region: { id: filters.regionsIds ? In(filters.regionsIds) : undefined },
        team: { id: filters.teamIds ? In(filters.teamIds) : undefined },
        status: filters.groupStatus ? In(filters.groupStatus) : undefined,
        rabbits: {
          name: filters.name ? ILike(`%${filters.name}%`) : undefined,
          status: filters.rabbitStatus ? In(filters.rabbitStatus) : undefined,
        },
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

  async update(
    id: number,
    updateDto: UpdateRabbitGroupInput,
    filters: {
      regionsIds?: number[];
      teamsIds?: number[];
    } = {},
  ) {
    const rabbitGroup = await this.rabbitGroupRespository.findOneBy({
      id,
      region: { id: filters.regionsIds ? In(filters.regionsIds) : undefined },
      team: { id: filters.teamsIds ? In(filters.teamsIds) : undefined },
    });
    if (!rabbitGroup) {
      throw new NotFoundException('Rabbit Group not found');
    }

    rabbitGroup.adoptionDescription =
      updateDto.adoptionDescription ?? rabbitGroup.adoptionDescription;

    rabbitGroup.adoptionDate =
      updateDto.adoptionDate ?? rabbitGroup.adoptionDate;

    rabbitGroup.status = updateDto.status ?? rabbitGroup.status;
    if (
      updateDto.status != null &&
      updateDto.status !== RabbitGroupStatus.Adopted &&
      !updateDto.adoptionDate
    ) {
      // adoptionDate should be null if status is not 'Adopted',
      rabbitGroup.adoptionDate = null;
    }

    return await this.rabbitGroupRespository.save(rabbitGroup);
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
   * @param teamId - The ID of the team to assign to the rabbit group, or null to remove the team.
   * @returns The updated rabbit group.
   * @throws {NotFoundException} if the rabbit group or team is not found.
   * @throws {BadRequestException} if the team is not active or the rabbit group has a different region than the team.
   */
  async updateTeam(
    id: number,
    teamId?: number,
    regionsIds?: number[],
  ): Promise<RabbitGroup> {
    const rabbitGroup = await this.rabbitGroupRespository.findOneBy({
      id,
      region: { id: regionsIds ? In(regionsIds) : undefined },
    });
    if (!rabbitGroup) {
      throw new NotFoundException('Rabbit Group not found');
    }

    if (teamId) {
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
    } else {
      rabbitGroup.team = null;
    }
    const result = await this.rabbitGroupRespository.save(rabbitGroup);

    if (rabbitGroup.team) {
      this.notificationsService.sendNotification(
        new NotificationGroupAssigned(rabbitGroup.team.id, id),
      );
    }

    return result;
  }

  /**
   * Checks the adoption state of rabbit groups, and sends notifications for those that need confirmation.
   * @cron initializes in the onModuleInit lifecycle hook
   */
  async checkAdoptionState(): Promise<void> {
    this.logger.log('Starting adoption check cron job - sending notifications');

    const rabbitGroups = await this.rabbitGroupRespository.find({
      relations: {
        rabbits: true,
        team: true,
        region: true,
      },
      where: {
        status: Not(RabbitGroupStatus.Adopted),
        adoptionDate: LessThan(new Date()),
      },
    });

    for (const rabbitGroup of rabbitGroups) {
      if (rabbitGroup.status !== RabbitGroupStatus.Adoptable) {
        this.logger.warn(
          `AdoptedAt date is in the future, but status is not '${RabbitGroupStatus.Adoptable}' for rabbit group ${rabbitGroup.id}`,
        );
      }
      this.logger.debug(
        `AdoptedAt date is in the future, sending notification for rabbit group ${rabbitGroup.id}`,
      );

      const groupName = (await rabbitGroup.rabbits)
        .map((rabbit) => rabbit.name)
        .join(', ');

      this.notificationsService.sendNotification(
        new NotificationAdoptionToConfirm(
          rabbitGroup.adoptionDate,
          rabbitGroup.region.id,
          rabbitGroup.id,
          groupName,
          rabbitGroup.team ? rabbitGroup.team.id : null,
        ),
      );
    }
  }
}
