import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Team } from '../../../../users/entities/team.entity';
import { RabbitGroup } from '../../../../rabbits/entities/rabbit-group.entity';

@Entity()
@ObjectType()
export class Region {
  constructor(partial?: Partial<Region>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number;

  @Column({
    unique: true,
  })
  @Field()
  name: string;

  @OneToMany(() => Team, (team) => team.region)
  @Field(() => [Team], { nullable: true })
  teams: Promise<Team[]>;

  @OneToMany(() => RabbitGroup, (team) => team.region)
  rabbitGroups: Promise<RabbitGroup[]>;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
