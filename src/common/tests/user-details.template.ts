import { Role, UserDetails } from '../../common/modules/auth';

const userDetailsTeplate = new UserDetails({
  id: 1,
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
  managerRegions: [2],
});

/**
 * Represents a user with the role of Region Manager.
 * regions is set to [1, 3].
 */
export const userRegionManager2Regions = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.RegionManager],
  managerRegions: [1, 3],
});

/**
 * Represents a user region observer.
 * regions is set to [2].
 */
export const userRegionObserver = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.RegionObserver],
  observerRegions: [2],
});

/**
 * Represents a user region observer.
 * regions is set to [1, 3].
 */
export const userRegionObserver2Regions = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.RegionObserver],
  observerRegions: [1, 3],
});

/**
 * Represents a user with the role of Admin.
 */
export const userAdmin = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.Admin],
});

/**
 * Represents a user with no roles.
 */
export const userNoRoles = new UserDetails({
  ...userDetailsTeplate,
  roles: [],
});

/**
 * Represents a user with the roles of Region Manager and Region Observer.
 * managerRegions is set to [1].
 * observerRegions is set to [2].
 */
export const userRegionManagerAndObserver = new UserDetails({
  ...userDetailsTeplate,
  roles: [Role.RegionManager, Role.RegionObserver],
  managerRegions: [1],
  observerRegions: [2],
});
