import { Role } from '../roles.eum';

export class UserDetails {
  constructor(partial?: {
    id?: number;
    uid?: string;
    email?: string;
    phone?: string;
    roles?: Role[];
    teamId?: number;
    managerRegions?: number[];
    observerRegions?: number[];
  }) {
    partial.roles ??= [];

    if (partial.roles.includes(Role.RegionManager) && !partial.managerRegions) {
      throw new Error('RegionManager role requires managerRegions');
    }
    if (
      partial.roles.includes(Role.RegionObserver) &&
      !partial.observerRegions
    ) {
      throw new Error('RegionObserver role requires observerRegions');
    }
    if (partial.roles.includes(Role.Volunteer) && !partial.teamId) {
      throw new Error('Volunteer role requires teamId');
    }

    Object.assign(this, partial);
  }
  readonly id?: number;
  readonly uid: string;
  readonly email: string;
  readonly phone: string;
  private roles: Role[];
  readonly teamId?: number;
  readonly managerRegions?: number[];
  readonly observerRegions?: number[];

  /**
   * Checks if the current user has at least one of the specified role(s).
   * @param role - The role(s) to check.
   * @returns `true` if the current user has the role(s), `false` otherwise.
   */
  checkRole(role: Role | Role[]): boolean {
    if (Array.isArray(role)) {
      return role.some((r) => this.roles.includes(r));
    }

    return this.roles.includes(role);
  }

  /**
   * Returns all regions that the current user has access to.
   * This field is a combination regions from roles RegionManager and RegionObserver.
   *
   * @returns An array of region IDs.
   */
  get regions(): number[] {
    return [...(this.managerRegions ?? []), ...(this.observerRegions ?? [])];
  }

  /**
   * Checks if the current user has access to all of the specified region(s).
   * This function check access in all roles. (Admin, RegionManager, RegionObserver)
   *
   * @param regionID - The region(s) to check.
   * @returns `true` if the current user has the region(s), `false` otherwise.
   */
  checkRegion(regionId: number | number[]): boolean {
    if (this.checkRole(Role.Admin)) {
      return true;
    }
    if (!this.checkRole([Role.RegionManager, Role.RegionObserver])) {
      return false;
    }

    if (!Array.isArray(regionId)) {
      regionId = [regionId];
    }
    const regions = this.regions;
    return regionId.every((r) => regions.includes(r));
  }

  /**
   * Check if the current user has RegionManager role with access to all of specified regions
   *
   * @param regionId - The region(s) to check.
   * @returns `true` if user has access, `false` otherwise.
   */
  checkRegionManager(regionId: number | number[]): boolean {
    if (!this.checkRole(Role.RegionManager)) {
      return false;
    }

    if (!Array.isArray(regionId)) {
      regionId = [regionId];
    }
    return regionId.every((r) => this.managerRegions.includes(r));
  }

  /**
   * Check if the current user has RegionObserver role with access to all of specified regions
   *
   * @param regionId - The region(s) to check.
   * @returns `true` if user has access, `false` otherwise.
   */
  checkRegionObserver(regionId: number | number[]): boolean {
    if (!this.checkRole(Role.RegionObserver)) {
      return false;
    }

    if (!Array.isArray(regionId)) {
      regionId = [regionId];
    }
    return regionId.every((r) => this.observerRegions.includes(r));
  }

  /**
   * Checks if the current user has Volumeer role with access to the specified team.
   *
   * @param teamId - The team ID to check.
   * @returns `true` if the current user has access to the team, `false` otherwise.
   */
  checkVolunteer(teamId: number): boolean {
    if (!this.checkRole(Role.Volunteer)) {
      return false;
    }
    return this.teamId === teamId;
  }
}
