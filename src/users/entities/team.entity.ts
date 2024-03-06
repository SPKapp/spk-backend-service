import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './user.entity';
import { Region } from '../../common/modules/region/entities/region.entity';

@Entity()
@ObjectType()
export class Team {
  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @ManyToOne(() => Region, (region) => region.teams, { eager: true })
  @Field(() => Region, { nullable: true })
  region: Region;

  @OneToMany(() => User, (user) => user.team)
  @Field(() => [User], { nullable: true })
  users: Promise<User[]>;
}
