import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Team } from '../../../../users/entities/team.entity';

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
}
