import { Role, UserDetails } from '../../common/modules/auth/auth.module';

const userDetailsTeplate = new UserDetails({
  uid: '123',
  email: 'email1@example.com',
  phone: '123456789',
});

/**
 * Represents a user with the role of Volunteer.
 * teamId is set to 1.
 */
export const userVolunteer = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.Volunteer],
  teamId: 1,
});

/**
 * Represents a user with the role of Volunteer.
 * teamId is set to 2.
 */
export const userVolunteer2 = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.Volunteer],
  teamId: 2,
});

/**
 * Represents a user with the role of Region Manager.
 * regions is set to [2].
 */
export const userRegionManager = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.RegionManager],
  regions: [2],
});

/**
 * Represents a user with the role of Region Manager.
 * regions is set to [1, 3].
 */
export const userRegionManager2Regions = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.RegionManager],
  regions: [1, 3],
});

/**
 * Represents a user region observer.
 * regions is set to [2].
 */
export const userRegionObserver = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.RegionObserver],
  regions: [2],
});

/**
 * Represents a user with the role of Admin.
 */
export const userAdmin = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.Admin],
});
