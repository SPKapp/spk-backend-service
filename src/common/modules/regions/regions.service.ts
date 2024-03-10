import { Injectable } from '@nestjs/common';
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

  async create(input: CreateRegionInput): Promise<Region> {
    return await this.regionRepository.save(new Region(input));
  }

  async findAll(offset: number, limit: number): Promise<Region[]> {
    return await this.regionRepository.find({
      skip: offset,
      take: limit,
    });
  }

  async count(): Promise<number> {
    return await this.regionRepository.count();
  }

  async findOne(id: number): Promise<Region | null> {
    return await this.regionRepository.findOneBy({ id });
  }

  async update(input: UpdateRegionInput): Promise<Region> {
    return await this.regionRepository.save(input);
  }

  async remove(id: number) {
    await this.regionRepository.findOneOrFail({ where: { id } });
    await this.regionRepository.delete(id);
    return id;
  }
}
