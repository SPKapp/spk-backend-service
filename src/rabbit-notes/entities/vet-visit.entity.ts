import { ObjectType, Field } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RabbitNote } from './rabbit-note.entity';
import { VisitInfo } from './visit-info.entity';

@Entity()
@ObjectType()
export class VetVisit {
  constructor(partial?: Partial<VetVisit>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Field({
    nullable: true,
    description: 'If not provided, the current date is used.',
  })
  date: Date;

  @OneToOne(() => RabbitNote, (rabbitNote) => rabbitNote.vetVisit, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  note: RabbitNote;

  @OneToMany(() => VisitInfo, (visitInfo) => visitInfo.vetVisit, {
    eager: true,
    cascade: true,
  })
  @Field(() => [VisitInfo])
  visitInfo: VisitInfo[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
