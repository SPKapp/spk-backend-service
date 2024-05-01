import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Team } from './team.entity';
import { User } from './user.entity';

@Entity()
export class TeamHistory {
  constructor(partial?: Partial<TeamHistory>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, (team) => team.usersHistory, { onDelete: 'CASCADE' })
  team: Team;

  @ManyToOne(() => User, (user) => user.teamsHistory, { onDelete: 'CASCADE' })
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
