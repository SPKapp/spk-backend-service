import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
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
