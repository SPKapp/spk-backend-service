import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  Admin = 'Admin',
  RegionManager = 'RegionManager',
  RegionObserver = 'RegionObserver',
  Volunteer = 'Volunteer',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'The role of a user',
  valuesMap: {
    Admin: {
      description: 'An administrator',
    },
    RegionManager: {
      description: 'A region manager',
    },
    RegionObserver: {
      description: 'A region observer',
    },
    Volunteer: {
      description: 'A volunteer',
    },
  },
});
