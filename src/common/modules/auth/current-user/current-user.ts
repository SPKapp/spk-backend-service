import { Role } from '../roles.eum';

export class UserDetails {
  constructor(partial?: Partial<UserDetails>) {
    Object.assign(this, partial);
  }

  uid: string;
  email: string;
  phone: string;
  roles: Role[];
  regions?: number[];
  teamId?: number;
  id?: number;

  /**
   * Checks if the current user is an admin.
   *
   * @returns {boolean} True if the current user is an admin, false otherwise.
   */
  get isAdmin(): boolean {
    return this.roles.includes(Role.Admin);
  }

  /**
   * Checks if the current user is a region manager.
   *
   * @returns {boolean} Returns true if the current user is a region manager, otherwise returns false.
   */
  get isRegionManager(): boolean {
    return this.roles.includes(Role.RegionManager);
  }

  /**
   * Checks if the current user is a volunteer.
   *
   * @returns {boolean} True if the current user is a volunteer, false otherwise.
   */
  get isVolunteer(): boolean {
    return this.roles.includes(Role.Volunteer);
  }

  /**
   * Determines whether the current user has at least the role of a region manager.
   *
   * @returns {boolean} True if the user is an admin or a region manager, false otherwise.
   */
  get isAtLeastRegionManager(): boolean {
    return this.isAdmin || this.isRegionManager;
  }

  checkRole(role: Role | Role[]): boolean {
    if (Array.isArray(role)) {
      return role.some((r) => this.roles.includes(r));
    }

    return this.roles.includes(role);
  }
}
