import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Region } from './entities/region.entity';
import { CreateRegionInput } from './dto/create-region.input';
import { UpdateRegionInput } from './dto/update-region.input';

@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  /**
   * Creates a new region.
   * @param input - The input data for creating the region.
   * @returns A Promise that resolves to the created region.
   */
  async create(input: CreateRegionInput): Promise<Region> {
    return await this.regionRepository.save(new Region(input));
  }

  /**
   * Retrieves all regions with pagination.
   *
   * @param offset - (optional) The number of records to skip.
   * @param limit - (optional) The maximum number of records to retrieve.
   * @returns A promise that resolves to an array of Region objects.
   */
  async findAll(offset?: number, limit?: number): Promise<Region[]> {
    return await this.regionRepository.find({
      skip: offset,
      take: limit,
    });
  }

  /**
   * Returns the number of regions.
   *
   * @returns A Promise that resolves to the number of regions.
   */
  async count(): Promise<number> {
    return await this.regionRepository.count();
  }

  /**
   * Finds a region by its ID.
   *
   * @param id - The ID of the region to find.
   * @returns A Promise that resolves to the found region, or null if not found.
   */
  async findOne(id: number): Promise<Region | null> {
    return await this.regionRepository.findOneBy({ id });
  }

  /**
   * Updates a region with the specified ID.
   *
   * @param id - The ID of the region to update.
   * @param input - The updated region data.
   * @returns A Promise that resolves to the updated region.
   * @throws {NotFoundException} if the region with the specified ID is not found.
   */
  async update(id: number, input: UpdateRegionInput): Promise<Region> {
    const region = await this.regionRepository.findOneBy({ id });
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }
    if (input.name) {
      region.name = input.name;
    }

    return await this.regionRepository.save(region);
  }

  /**
   * Removes a region by its ID.
   *
   * @param id - The ID of the region to remove.
   * @returns The ID of the removed region.
   * @throws {NotFoundException} If the region with the specified ID is not found.
   * @throws {BadRequestException} If the region is in use by a team.
   */
  async remove(id: number) {
    const region = await this.regionRepository.findOneBy({ id });
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    const teams = await region.teams;

    if (teams.length > 0) {
      throw new BadRequestException('Region is in use by a team');
    }

    // TODO: Check if the region is used by any rabbit before deleting

    await this.regionRepository.softDelete(id);
    return id;
  }
}
