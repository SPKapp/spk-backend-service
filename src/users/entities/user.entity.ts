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
  VirtualColumn,
} from 'typeorm';

import { Team } from './team.entity';
import { RabbitNote } from '../../rabbit-notes/entities';
import { Region } from '../../common/modules/regions/entities';
import { RoleEntity } from './role.entity';
import { TeamHistory } from './team-history.entity';
import { FcmToken } from '../../notifications/entities';

/** Represents a user in the system.
 *
 * Users are the main actors in the system.
 * User is always associated with his default region.
 * User can be part of a team - if they have a Volunteer role.
 * User can be deactivated - if they are no longer active in the system - they can't login.
 *
 */
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

  @VirtualColumn({ query: () => "CONCAT(firstname, ' ', lastname)" })
  fullName: string;

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

  @ManyToOne(() => Team, (team) => team.users, { eager: true })
  @Field(() => Team, { nullable: true })
  team: Team;

  @ManyToOne(() => Region, (region) => region.users, { eager: true })
  @Field(() => Region)
  region: Region;

  @OneToMany(() => RabbitNote, (rabbitNote) => rabbitNote.user)
  rabbitNotes: Promise<RabbitNote[]>;

  @OneToMany(() => RoleEntity, (role) => role.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  roles: Promise<RoleEntity[]>;

  @OneToMany(() => TeamHistory, (teamHistory) => teamHistory.user)
  teamsHistory: Promise<TeamHistory[]>;

  @OneToMany(() => FcmToken, (fcmToken) => fcmToken.user)
  fcmTokens: Promise<FcmToken[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
