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
   * Checks if the current user has access to all of the specified region(s).
   * @param regionID - The region(s) to check.
   * @returns `true` if the current user has the region(s), `false` otherwise.
   */
  checkRegion(regionID: number | number[]): boolean {
    if (!this.regions) {
      return false;
    }

    if (Array.isArray(regionID)) {
      return regionID.every((r) => this.regions.includes(r));
    }

    return this.regions.includes(regionID);
  }

  /**
   * Checks if the current user has access to the specified team.
   * @param teamId - The team ID to check.
   * @returns `true` if the current user has access to the team, `false` otherwise.
   */
  checkTeam(teamId: number): boolean {
    return this.teamId === teamId;
  }
}
