import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Team } from '../entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
  ) {}

  findAll(region?: string): Promise<Team[]> {
    if (region) {
      return this.teamRepository.find({
        where: { region: { name: region } },
      });
    }
    return this.teamRepository.find();
  }

  async findOne(id: number): Promise<Team> {
    return await this.teamRepository.findOneByOrFail({ id });
  }
}
