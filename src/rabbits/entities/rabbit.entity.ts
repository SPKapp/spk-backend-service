import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AdmissionType } from './enums/admissionType.enum';
import { Gender } from './enums/gender.enum';
import { RabbitStatus } from './enums/rabbit-status.enum';
import { RabbitGroup } from './rabbit-group.entity';
import { RabbitNote } from '../../rabbit-notes/entities';

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

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 3,
    nullable: true,
    comment: 'Can be set only by RabbitNote.',
  })
  @Field(() => Float, {
    nullable: true,
    description:
      'The weight of the rabbit in kilograms. Can be set only by RabbitNote.',
  })
  weight?: number;

  @Column({
    nullable: true,
    comment: 'Can be set only by RabbitNote.',
  })
  @Field({
    nullable: true,
    description:
      'The number of the chip implanted in the rabbit. Can be set only by RabbitNote.',
  })
  chipNumber?: string;

  @Column({
    nullable: true,
    comment: 'Can be set only by RabbitNote.',
  })
  @Field({
    nullable: true,
    description: 'The date of the castration. Can be set only by RabbitNote.',
  })
  castrationDate?: Date;

  @Column({
    nullable: true,
    comment: 'Can be set only by RabbitNote.',
  })
  @Field({
    nullable: true,
    description: 'The date of the deworming. Can be set only by RabbitNote.',
  })
  dewormingDate?: Date;

  @Column({
    nullable: true,
    comment: 'Can be set only by RabbitNote.',
  })
  @Field({
    nullable: true,
    description: 'The date of the vaccination. Can be set only by RabbitNote.',
  })
  vaccinationDate?: Date;

  @Column({
    type: 'enum',
    enum: RabbitStatus,
    default: RabbitStatus.Incoming,
  })
  @Field(() => RabbitStatus)
  status?: RabbitStatus;

  @ManyToOne(() => RabbitGroup, (rabbitGroup) => rabbitGroup.rabbits, {
    eager: true,
  })
  @Field(() => RabbitGroup)
  rabbitGroup: RabbitGroup;

  @OneToMany(() => RabbitNote, (rabbitNote) => rabbitNote.rabbit)
  notes?: Promise<RabbitNote[]>;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
