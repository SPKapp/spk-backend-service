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
import { Gender } from './gender.enum';

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

  @Column({
    nullable: true,
  })
  @Field({
    description: 'The color of the rabbit',
    nullable: true,
  })
  color?: string;

  @Column({
    nullable: true,
  })
  @Field({
    nullable: true,
  })
  breed?: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.Unknown,
  })
  @Field(() => Gender)
  gender: Gender;

  @Column({
    nullable: true,
  })
  @Field({
    nullable: true,
  })
  birthDate?: Date;

  @Column({
    default: false,
  })
  @Field()
  confirmedBirthDate: boolean;

  @Column({
    nullable: true,
  })
  @Field({
    nullable: true,
  })
  admissionDate?: Date;

  @Column({
    type: 'enum',
    enum: AdmissionType,
    default: AdmissionType.Found,
  })
  @Field(() => AdmissionType)
  admissionType: AdmissionType;

  @Column({
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Field({
    nullable: true,
  })
  fillingDate?: Date;

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
