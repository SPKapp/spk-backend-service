import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { VisitType } from './visit-type.enum';
import { VetVisit } from './vet-visit.entity';

@Entity()
@Unique(['vetVisit', 'visitType'])
@ObjectType()
export class VisitInfo {
  constructor(partial?: Partial<VisitInfo>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VetVisit, (vetVisit) => vetVisit.visitInfo, {
    nullable: false,
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  vetVisit: VetVisit;

  @Column({
    type: 'enum',
    enum: VisitType,
  })
  @Field(() => VisitType)
  visitType: VisitType;

  @Column({
    nullable: true,
  })
  @Field({
    nullable: true,
  })
  additionalInfo?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
