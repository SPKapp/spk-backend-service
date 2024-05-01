import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Team } from './team.entity';
import { User } from './user.entity';

@Entity()
@Unique(['team', 'user'])
export class TeamHistory {
  constructor(partial?: Partial<TeamHistory>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('Team', 'teamHistories')
  team: Team;

  @ManyToOne('User', 'teamHistories')
  user: User;

  @Column({
    default: () => 'CURRENT_TIMESTAMP',
  })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
