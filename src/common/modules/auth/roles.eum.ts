import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  Admin = 'admin',
  RegionManager = 'region_manager',
  RegionObserver = 'region_observer',
  Volunteer = 'volunteer',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'The role of a user',
});
