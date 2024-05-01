import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Team } from './team.entity';
import { RabbitNote } from '../../rabbit-notes/entities';
import { RoleEntity } from './role.entity';
import { TeamHistory } from './team-history.entity';

@Entity()
@ObjectType()
export class User {
  constructor(partial?: Partial<User>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column()
  @Field()
  firstname: string;

  @Column()
  @Field()
  lastname: string;

  @Column({ unique: true })
  @Field({})
  email: string;

  @Column({ unique: true })
  @Field()
  phone: string;

  @Column({ unique: true })
  @Field(() => ID)
  firebaseUid: string;

  @Column()
  @Field()
  active: boolean;

  // TODO: Add Adress field

  @ManyToOne(() => Team, (team) => team.users, { eager: true })
  @Field(() => Team)
  team: Team;

  @OneToMany(() => RabbitNote, (rabbitNote) => rabbitNote.user)
  rabbitNotes: Promise<RabbitNote[]>;

  @OneToMany(() => RoleEntity, (role) => role.user)
  roles: Promise<RoleEntity[]>;

  @OneToMany(() => TeamHistory, (teamHistory) => teamHistory.user)
  teamsHistory: Promise<TeamHistory[]>;
}
