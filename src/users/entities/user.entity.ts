import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Team } from './team.entity';

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

  // TODO: Validate email
  @Column({ unique: true })
  @Field({})
  email: string;

  // TODO: Validate phone
  @Column({ unique: true })
  @Field()
  phone: string;

  @Column({ unique: true })
  @Field(() => ID)
  firebaseUid: string;

  // TODO: Add Adress field

  // TODO: Eagar or lazy?
  @ManyToOne(() => Team, (team) => team.users)
  @Field(() => Team)
  team: Team;
}
