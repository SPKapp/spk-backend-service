import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { PermissionsService } from '../../../users';

import { Region } from './entities';
import {
  CreateRegionInput,
  UpdateRegionInput,
  PaginatedRegions,
  FindRegionsArgs,
} from './dto';

@Injectable()
export class RegionsService {
  logger = new Logger(RegionsService.name);

  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Creates a new region.
   * @param input - The input data for creating the region.
   * @returns A Promise that resolves to the created region.
   * @throws {ConflictException} `region-already-exists`: Region with the same name already exists.
   */
  async create(input: CreateRegionInput): Promise<Region> {
    try {
      const result = await this.regionRepository.save(new Region(input));

      this.logger.log(
        `Created region with ID: ${result.id} and name: ${result.name}`,
      );
      return result;
    } catch (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new ConflictException(
          'Region with the same name already exists.',
          'region-already-exists',
        );
      }

      throw new InternalServerErrorException('Failed to create region.');
    }
  }

  /**
   * Retrieves paginated regions based on the provided filters.
   *
   * @param filters - The filters to apply to the regions.
   * @param totalCount - Whether to include the total count of regions.
   * @returns A Promise that resolves to a PaginatedRegions object containing the paginated regions.
   */
  async findAllPaginated(
    filters: FindRegionsArgs = {},
    totalCount: boolean = false,
  ): Promise<PaginatedRegions> {
    filters.offset ??= 0;
    filters.limit ??= 10;

    const options = this.createFilterOptions(filters);

    return {
      data: await this.regionRepository.find(options),
      offset: filters.offset,
      limit: filters.limit,
      totalCount: totalCount
        ? await this.regionRepository.countBy(options.where)
        : undefined,
    };
  }

  /**
   * Retrieves all regions based on the provided filters.
   *
   * @param filters - The filters to apply to the regions.
   * @returns A Promise that resolves to an array of regions.
   */
  async findAll(filters: FindRegionsArgs = {}): Promise<Region[]> {
    return await this.regionRepository.find(this.createFilterOptions(filters));
  }

  private createFilterOptions(
    filters: FindRegionsArgs,
  ): FindManyOptions<Region> {
    return {
      skip: filters.offset,
      take: filters.limit,
      where: {
        id: filters.ids ? In(filters.ids) : undefined,
        name: filters.name ? ILike(`%${filters.name}%`) : undefined,
      },
    };
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
   * Finds a region by its name.
   *
   * @param name - The name of the region to find.
   * @returns A Promise that resolves to the found region, or null if not found.
   */
  async findOneByName(name: string): Promise<Region | null> {
    return await this.regionRepository.findOneBy({ name });
  }

  /**
   * Updates a region with the specified ID.
   *
   * @param id - The ID of the region to update.
   * @param input - The updated region data.
   * @returns A Promise that resolves to the updated region.
   * @throws {NotFoundException} `region-not-found`: Region with the specified ID is not found.
   * @throws {ConflictException} `region-already-exists`: Region with the same name already exists.
   */
  async update(id: number, input: UpdateRegionInput): Promise<Region> {
    const region = await this.regionRepository.findOneBy({ id });
    if (!region) {
      throw new NotFoundException(`Region not found`, 'region-not-found');
    }
    if (input.name) {
      region.name = input.name;
    }

    try {
      const result = await this.regionRepository.save(region);

      this.logger.log(
        `Updated region with ID: ${result.id} and name: ${result.name}`,
      );

      return result;
    } catch (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new ConflictException(
          'Region with the same name already exists.',
          'region-already-exists',
        );
      }

      throw new InternalServerErrorException('Failed to update region.');
    }
  }

  /**
   * Removes a region by its ID.
   *
   * @param id - The ID of the region to remove.
   * @returns The ID of the removed region.
   * @throws {NotFoundException} `region-not-found`: Region with the specified ID is not found.
   * @throws {BadRequestException} `region-in-use`: Region is in use and cannot be removed.
   */
  @Transactional()
  async remove(id: number) {
    const region = await this.regionRepository.findOneBy({ id });
    if (!region) {
      throw new NotFoundException(`Region not found`, 'region-not-found');
    }

    // TODO: This should be done in a more efficient way
    const teams = await region.teams;
    const users = await region.users;
    const rabbitgroups = await region.rabbitGroups;

    if (teams.length > 0 || users.length > 0 || rabbitgroups.length > 0) {
      throw new BadRequestException(
        'Region cannot be removed. It is in use.',
        'region-in-use',
      );
    }

    // Remove permissions to the region
    await this.permissionsService.removePermissionsForRegion(id);

    region.name = `deleted_${region.id}_${region.name}`;
    await this.regionRepository.softRemove(region);
    await this.regionRepository.save(region);

    this.logger.log(`Removed region with ID: ${id}`);

    return id;
  }
}
