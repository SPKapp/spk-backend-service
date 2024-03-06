import {
  BadRequestException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
   * @param region_id - The ID of the region for the team.
   * @returns A Promise that resolves to the created team.
   * @throws {BadRequestException} if the region with the provided ID does not exist.
   */
  async create(region_id: number): Promise<Team> {
    const region = await this.regionService.findOne(region_id);
    if (!region) {
      throw new BadRequestException(
        'Region with the provided id does not exist',
      );
    }

    return await this.teamRepository.save(new Team({ region }));
  }

  /**
   * Retrieves all teams from the database.
   *
   * @param region - Optional region name to filter teams by.
   * @returns A promise that resolves to an array of Team objects.
   */
  // TODO: Add pagination
  async findAll(region?: string): Promise<Team[]> {
    if (region) {
      return await this.teamRepository.findBy({ region: { name: region } });
    }
    return await this.teamRepository.find();
  }

  /**
   * Retrieves a single team from the database by its ID.
   *
   * @param id - The ID of the team to retrieve.
   * @returns A promise that resolves to a Team object, or null if not found.
   */
  async findOne(id: number): Promise<Team | null> {
    return await this.teamRepository.findOneBy({ id });
  }

  // TODO: Add update method
  async update(id: number, region_id: number): Promise<Team> {
    // Try Remove and Recreate with same users in new region
    console.log(`Update team ${id} to region ${region_id}`);
    throw new NotImplementedException();
  }

  /**
   * Removes a team by its ID.
   * @param id - The ID of the team to be removed.
   * @returns A Promise that resolves to the removed team.
   * @throws {BadRequestException} if the team with the provided ID does not exist.
   */
  // TODO: Check if there are any users in the team
  // TODO: Check if there are active rabbits connected to the team
  async remove(id: number): Promise<Team> {
    const team = await this.teamRepository.findOneBy({ id });
    if (!team) {
      throw new BadRequestException('Team with the provided id does not exist');
    }
    await this.teamRepository.remove(team);
    return team;
  }
}
