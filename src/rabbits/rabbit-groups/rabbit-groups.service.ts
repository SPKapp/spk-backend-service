import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { RabbitGroup } from '../entities/rabbit-group.entity';
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class RabbitGroupsService {
  private readonly logger = new Logger(RabbitGroupsService.name);

  constructor(
    @InjectRepository(RabbitGroup)
    private readonly rabbitGroupRespository: Repository<RabbitGroup>,
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

  findAll() {
    // TODO: Implement this method
    return `This action returns all rabbitGroups`;
  }

  async findOne(id: number) {
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
}
