import {
  BadRequestException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { RegionService } from '../../common/modules/region/region.service';

import { Team } from '../entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
    private readonly regionService: RegionService,
  ) {}

  /**
   * Creates a new team based on the provided region ID.
   *
   * @param regionId - The ID of the region for the team.
   * @returns A Promise that resolves to the created team.
   * @throws {BadRequestException} if the region with the provided ID does not exist.
   */
  async create(regionId: number): Promise<Team> {
    const region = await this.regionService.findOne(regionId);
    if (!region) {
      throw new BadRequestException(
        'Region with the provided id does not exist',
      );
    }

    return await this.teamRepository.save(new Team({ region }));
  }

  /**
   * Retrieves all teams based on the provided regions IDs.
   * If regions IDs are not provided, retrieves all teams.
   *
   * @param regionsIds - An optional array of regions IDs.
   * @returns A promise that resolves to an array of Team objects.
   */
  // TODO: Add pagination
  async findAll(regionsIds?: number[]): Promise<Team[]> {
    return await this.teamRepository.findBy({
      region: { id: regionsIds ? In(regionsIds) : undefined },
    });
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

  // TODO: Implement this method
  async update(id: number, regionId: number): Promise<Team> {
    // Try Remove and Recreate with same users in new region
    console.log(`Update team ${id} to region ${regionId}`);
    throw new NotImplementedException();
  }

  /**
   * Removes a team by its ID.
   * @param id - The ID of the team to be removed.
   * @returns A Promise that resolves to the removed team id.
   * @throws {BadRequestException} if the team with the provided ID does not exist or cannot be removed.
   */
  async remove(id: number): Promise<number> {
    if (!(await this.canRemove(id))) {
      throw new BadRequestException('Team cannot be removed');
    }
    await this.teamRepository.delete({ id });
    return id;
  }

  /**
   * Checks if a team can be removed.
   * A team can be removed if it has no users and no active rabbits connected to it.
   *
   * @param id - The ID of the team to be checked.
   * @param userId - The ID of the user that should be excluded from the check.
   * @returns A Promise that resolves to a boolean value indicating if the team can be removed.
   */
  async canRemove(id: number, userId?: number): Promise<boolean> {
    const team = await this.teamRepository.findOneBy({ id });
    if (!team) {
      throw new BadRequestException('Team with the provided id does not exist');
    }

    let users = await team.users;
    users = users.filter((user) => user.id !== userId);
    if (users.length > 0) {
      return false;
    }

    // TODO: Check if there are active rabbits connected to the team
    return true;
  }
}
