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

import { Role } from '../../common/modules/auth';
import { User } from './user.entity';

@Entity()
@Unique(['role', 'additionalInfo', 'user'])
export class RoleEntity {
  constructor(partial?: Partial<RoleEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: Role,
  })
  role: Role;

  @Column({
    comment: `Additional information about the role:
    - RegionManager: regionId
    - RegionObserver: regionId
    - TeamManager: teamId
    `,
  })
  additionalInfo: number;

  @ManyToOne(() => User, (user) => user.roles)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
