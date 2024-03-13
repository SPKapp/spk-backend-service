import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AdmissionType } from './admissionType.enum';
import { RabbitGroup } from './rabbit-group.entity';

@Entity()
@ObjectType()
export class Rabbit {
  constructor(partial?: Partial<Rabbit>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column()
  @Field()
  name: string;

  @Column()
  @Field(() => AdmissionType)
  admissionType: AdmissionType;

  @Column()
  @Field({
    description: 'The color of the rabbit',
  })
  color: string;

  @ManyToOne(() => RabbitGroup, (rabbitGroup) => rabbitGroup.rabbits, {
    eager: true,
  })
  @Field(() => RabbitGroup)
  rabbitGroup: RabbitGroup;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
