import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RabbitNotesService } from './rabbit-notes.service';
import { RabbitNotesResolver } from './rabbit-notes.resolver';
import { PaginatedRabbitNoteResolver } from './paginated-rabbit-note.resolver';

import { RabbitNote, VetVisit, VisitInfo } from './entities';

import { RabbitsModule } from '../rabbits/rabbits.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RabbitNote, VetVisit, VisitInfo]),
    RabbitsModule,
    NotificationsModule,
  ],
  providers: [
    RabbitNotesResolver,
    RabbitNotesService,
    PaginatedRabbitNoteResolver,
  ],
})
export class RabbitNotesModule {}
