import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegionService } from './region.service';
import { RegionResolver } from './region.resolver';

import { Region } from './entities/region.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Region])],
  providers: [RegionResolver, RegionService],
  exports: [RegionService],
})
export class RegionModule {}

/*
 * Region is an individual organizational unit,
 * we assume that each person, rabbit, and activity
 * takes place within a specific region.
 */
