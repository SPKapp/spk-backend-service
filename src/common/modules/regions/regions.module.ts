import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegionsService } from './regions.service';
import { RegionsResolver } from './regions.resolver';
import { PaginatedRegionsResolver } from './paginated-regions.resolver';

import { Region } from './entities/region.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Region])],
  providers: [RegionsResolver, RegionsService, PaginatedRegionsResolver],
  exports: [RegionsService],
})
export class RegionsModule {}
