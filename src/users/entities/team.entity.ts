import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Region } from '../../common/modules/regions/entities';
import { RabbitGroup } from '../../rabbits/entities';
import { TeamHistory } from './team-history.entity';

@Entity()
@ObjectType()
export class Team {
  constructor(partial: Partial<Team>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  /**
   * Team is active if has at least one active user.
   *
   * If all users are inactive, the team is inactive as well.
   * Inactive teams shouldn't have any active RabbitGroups associated.
   *
   * If all users are inactive, and none of the RabbitGroups are connected the team should be deleted.
   *
   *
   * When reactive a team:
   * - When a user is activated, the team should be activated as well.
   * - When a user is added to an inactive team, the team should be activated.
   *
   * When deactivating a team:
   * - When the last user is deactivated/deleted, the team should be deactivated. (If team has no active RabbitGroups)
   * - When a last user is removed from a team, the team should be deactivated. (If team has no active RabbitGroups)
   *
   * When deleting a team:
   * - When the last user is deactivated/deleted, and none of the RabbitGroups are connected the team should be deleted.
   * - When a last user is removed from a team, and none of the RabbitGroups are connected the team should be deleted.
   */
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

  /**
   * The RabbitGroup entity should always be in the same Region as the Team.
   */
  @OneToMany(() => RabbitGroup, (rabbitGroup) => rabbitGroup.team)
  @Field(() => [RabbitGroup])
  rabbitGroups: Promise<RabbitGroup[]>;

  /**
   * This field should be used to track the history of the team.
   */
  @OneToMany(() => TeamHistory, (usersHistory) => usersHistory.team)
  usersHistory: Promise<TeamHistory[]>;
}
