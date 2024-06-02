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
import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Role } from '../../common/modules/auth';
import { User } from './user.entity';

@Entity()
@Unique(['role', 'additionalInfo', 'user'])
@ObjectType()
export class RoleEntity {
  constructor(partial?: Partial<RoleEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: Role,
    nullable: false,
  })
  @Field(() => Role)
  role: Role;

  @Column({
    comment: `Additional information about the role:
    - RegionManager: regionId
    - RegionObserver: regionId
    - TeamManager: teamId
    `,
    nullable: true,
  })
  @Field(() => ID, { nullable: true })
  additionalInfo: number;

  @ManyToOne(() => User, (user) => user.roles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
