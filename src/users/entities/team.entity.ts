import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Region } from '../../common/modules/regions/entities/region.entity';
import { RabbitGroup } from '../../rabbits/entities/rabbit-group.entity';

@Entity()
@ObjectType()
export class Team {
  constructor(partial: Partial<Team>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column({
    default: true,
  })
  @Field(() => Boolean, {
    defaultValue: true,
    description: 'The Team is active if has at least one active user.',
  })
  active: boolean;

  @ManyToOne(() => Region, (region) => region.teams, { eager: true })
  @Field(() => Region, { nullable: true })
  region: Region;

  @OneToMany(() => User, (user) => user.team)
  @Field(() => [User], { nullable: true })
  users: Promise<User[]>;

  @OneToMany(() => RabbitGroup, (rabbitGroup) => rabbitGroup.team)
  @Field(() => [RabbitGroup])
  rabbitGroups: Promise<RabbitGroup[]>;
}
