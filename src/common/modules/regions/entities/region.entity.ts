import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User, Team } from '../../../../users/entities';
import { RabbitGroup } from '../../../../rabbits/entities';

@Entity({
  orderBy: {
    name: 'ASC',
  },
})
@ObjectType()
export class Region {
  constructor(partial?: Partial<Region>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column()
  @Index({
    unique: true,
    where: '"deletedAt" IS NULL',
  })
  @Field()
  name: string;

  @OneToMany(() => Team, (team) => team.region)
  teams: Promise<Team[]>;

  @OneToMany(() => User, (user) => user.region)
  users: Promise<User[]>;

  @OneToMany(() => RabbitGroup, (team) => team.region)
  rabbitGroups: Promise<RabbitGroup[]>;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
