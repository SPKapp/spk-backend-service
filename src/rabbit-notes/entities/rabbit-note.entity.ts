import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { VetVisit } from './vet-visit.entity';
import { Rabbit } from '../../rabbits/entities/rabbit.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@ObjectType()
export class RabbitNote {
  constructor(partial?: Partial<RabbitNote>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column({
    nullable: true,
  })
  @Field({
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  @Field(() => Float, {
    nullable: true,
  })
  weight?: number;

  @OneToOne(() => VetVisit, (vetVisit) => vetVisit.note, {
    nullable: true,
    eager: true,
    cascade: true,
  })
  @Field(() => VetVisit, {
    nullable: true,
  })
  vetVisit?: VetVisit;

  @ManyToOne(() => Rabbit, (rabbit) => rabbit.notes, {
    nullable: false,
  })
  rabbit?: Rabbit;

  @ManyToOne(() => User, (user) => user.rabbitNotes, {
    nullable: false,
  })
  user?: User;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}