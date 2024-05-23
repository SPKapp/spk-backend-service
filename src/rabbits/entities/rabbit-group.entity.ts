import { ObjectType, Field, ID } from '@nestjs/graphql';
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

import { Region } from '../../common/modules/regions/entities/region.entity';
import { Team } from '../../users/entities/team.entity';
import { Rabbit } from './rabbit.entity';
import { RabbitGroupStatus } from './enums/group-status.enum';

@Entity()
@ObjectType({
  description:
    'A group of rabbits that are inseparable and are managed together.',
})
export class RabbitGroup {
  constructor(partial?: Partial<RabbitGroup>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column({
    default: '',
  })
  @Field({
    description: 'Description of the group for preparation for adoption',
  })
  adoptionDescription?: string;

  @Column({
    nullable: true,
  })
  @Field({
    nullable: true,
    description: 'The date the group was adopted',
  })
  adoptionDate?: Date;

  @Column({
    type: 'enum',
    enum: RabbitGroupStatus,
    default: RabbitGroupStatus.Incoming,
  })
  @Field(() => RabbitGroupStatus)
  status: RabbitGroupStatus;

  @ManyToOne(() => Region, (region) => region.rabbitGroups, { eager: true })
  @Field(() => Region)
  region: Region;

  @OneToMany(() => Rabbit, (rabbit) => rabbit.rabbitGroup)
  @Field(() => [Rabbit])
  rabbits: Promise<Rabbit[]>;

  @ManyToOne(() => Team, (team) => team.rabbitGroups, { eager: true })
  @Field(() => Team, { nullable: true })
  team?: Team;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
