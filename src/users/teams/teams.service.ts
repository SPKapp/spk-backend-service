import { BadRequestException, Injectable } from '@nestjs/common';
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
      return await this.teamRepository.find({
        where: { region: { name: region } },
      });
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

  // TODO: Add remove method
  async remove(id: number) {
    await this.teamRepository.findOneOrFail({ where: { id } });
    await this.teamRepository.delete(id);
    return id;
  }
}
