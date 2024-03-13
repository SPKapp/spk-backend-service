import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Region } from '../../common/modules/regions/entities/region.entity';
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
}
