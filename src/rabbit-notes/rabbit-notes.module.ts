import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitNotesResolver } from './rabbit-notes.resolver';

import { RabbitNote } from './entities/rabbit-note.entity';
import { VetVisit } from './entities/vet-visit.entity';
import { VisitInfo } from './entities/visit-info.entity';

import { RabbitsModule } from '../rabbits/rabbits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RabbitNote, VetVisit, VisitInfo]),
    RabbitsModule,
  ],
  providers: [RabbitNotesResolver, RabbitNotesService],
})
export class RabbitNotesModule {}
