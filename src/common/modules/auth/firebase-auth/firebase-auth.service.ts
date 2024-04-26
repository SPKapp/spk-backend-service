import { Injectable, Logger } from '@nestjs/common';

import { FirebaseService } from '../../firebase/firebase.service';

import { Role } from '../roles.eum';

@Injectable()
export class FirebaseAuthService {
  logger = new Logger(FirebaseAuthService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Creates a new user with the provided information.
   * @param email - The email address of the user.
   * @param phoneNumber - The phone number of the user.
   * @param displayName - The display name of the user.
   * @param password - The password for the user.
   * @returns A Promise that resolves to the UID of the created user.
   */
  async createUser(
    email: string,
    phoneNumber: string,
    displayName: string,
    password: string,
  ): Promise<string> {
    try {
      const user = await this.firebaseService.auth.createUser({
        email,
        phoneNumber,
        displayName,
        password,
      });

      return user.uid;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  /**
   * Sets the userId for a user in Firebase.
   *
   * This method should be called after {@link createUser} as soon as the userId is available.
   * UserId should be set only once and cannot be changed.
   *
   * @param uid - The unique identifier of the user.
   * @param userId - The ID of the user.
   * @returns A Promise that resolves when the userId is set successfully.
   */
  async setUserId(uid: string, userId: number): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);

    if (user.customClaims?.userId) {
      throw new Error('User already has a userId');
    }

    await this.firebaseService.auth.setCustomUserClaims(uid, {
      ...user.customClaims,
      userId,
    });
  }

  /**
   * Updates the user information in Firebase.
   *
   * @param uid - The unique identifier of the user.
   * @param email - The new email address of the user.
   * @param phoneNumber - The new phone number of the user.
   * @param displayName - The new display name of the user.
   * @returns A Promise that resolves when the user information is updated successfully.
   */
  async updateUser(
    uid: string,
    email: string,
    phoneNumber: string,
    displayName: string,
  ): Promise<void> {
    try {
      await this.firebaseService.auth.updateUser(uid, {
        email,
        phoneNumber,
        displayName,
      });
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  /**
   * Deletes a user from Firebase Authentication.
   * @param uid - The unique identifier of the user to delete.
   * @returns A Promise that resolves when the user is successfully deleted.
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.firebaseService.auth.deleteUser(uid);
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  /**
   * Adds a role to a user and optionally assigns regions to the user.
   *
   * @param uid - The ID of the user.
   * @param role - The role to be added to the user.
   * @param regionsIds - An optional array of region IDs to be assigned to the user (only applicable if the role is RegionManager).
   * @returns A Promise that resolves when the role and regions (if applicable) have been added to the user.
   */
  async addRoleToUser(
    uid: string,
    role: Role,
    regionsIds?: number[],
  ): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);
    const userRoles = user.customClaims?.roles || [];

    if (!userRoles.includes(role)) {
      userRoles.push(role);
      await this.firebaseService.auth.setCustomUserClaims(uid, {
        ...user.customClaims,
        roles: userRoles,
      });
    }

    if (role === Role.RegionManager && regionsIds) {
      const userRegions = user.customClaims?.regions || [];
      regionsIds.forEach((regionId) => {
        if (!userRegions.includes(regionId)) {
          userRegions.push(regionId);
        }
      });

      await this.firebaseService.auth.setCustomUserClaims(uid, {
        ...user.customClaims,
        roles: userRoles,
        regions: userRegions,
      });
    }
  }

  /**
   * Removes a role from a user.
   *
   * @param uid - The ID of the user.
   * @param role - The role to be removed.
   * @param regionsIds - Optional. An array of region IDs. Used only when
   *  the role is a Region Manager.If provided, removes the specified regions,
   *  if not, removes all regions and role.
   * @returns A Promise that resolves when the role is successfully removed.
   */
  async removeRoleFromUser(
    uid: string,
    role: Role,
    regionsIds?: number[],
  ): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);
    const userRoles: Role[] = user.customClaims?.roles || [];
    const roleIndex = userRoles.indexOf(role);

    if (role === Role.RegionManager) {
      let userRegions = user.customClaims?.regions || [];

      if (regionsIds) {
        regionsIds.forEach((regionId) => {
          const regionIndex = userRegions.indexOf(regionId);
          if (regionIndex !== -1) {
            userRegions.splice(regionIndex, 1);
          }
        });
      } else {
        userRegions = [];
      }

      if (roleIndex !== -1 && userRegions.length === 0) {
        userRoles.splice(roleIndex, 1);
      }

      await this.firebaseService.auth.setCustomUserClaims(uid, {
        ...user.customClaims,
        roles: userRoles,
        regions: userRegions,
      });
    } else if (roleIndex !== -1) {
      userRoles.splice(roleIndex, 1);
      await this.firebaseService.auth.setCustomUserClaims(uid, {
        ...user.customClaims,
        roles: userRoles,
      });
    }
  }

  /**
   * Adds a volunteer role to a user.
   *
   * This method is used to add the volunteer role to a user.
   * If the user already has the volunteer role, this method updates the teamId.
   *
   * @param uid - The ID of the user.
   * @param teamId - The ID of the team.
   * @returns A Promise that resolves when the volunteer role is added to the user.
   */
  async addVolunteerRole(uid: string, teamId: number): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);
    const userRoles = user.customClaims?.roles || [];

    if (!userRoles.includes(Role.Volunteer)) {
      userRoles.push(Role.Volunteer);
    }

    await this.firebaseService.auth.setCustomUserClaims(uid, {
      ...user.customClaims,
      roles: userRoles,
      teamId: teamId,
    });
    this.logger.log(
      `Added volunteer role to user ${uid} with teamId ${teamId}`,
    );
  }

  /**
   * Removes the volunteer role from a user.
   *
   * This method is used to remove the volunteer role from a user.
   * It also removes the teamId from the user.
   * If the user does not have the volunteer role, this method does nothing.
   *
   * @param uid - The ID of the user.
   * @returns A Promise that resolves when the volunteer role is removed from the user.
   */
  async removeVolunteerRole(uid: string): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);
    const userRoles: Role[] = user.customClaims?.roles || [];
    const roleIndex = userRoles.indexOf(Role.Volunteer);

    if (roleIndex !== -1) {
      userRoles.splice(roleIndex, 1);
      await this.firebaseService.auth.setCustomUserClaims(uid, {
        ...user.customClaims,
        roles: userRoles,
        teamId: undefined,
      });
      this.logger.log(`Removed volunteer role from user ${uid}`);
    } else if (user.customClaims?.teamId) {
      this.logger.warn(
        `User ${uid} does not have the volunteer role but has a teamId. Removing teamId.`,
      );
      await this.firebaseService.auth.setCustomUserClaims(uid, {
        ...user.customClaims,
        teamId: undefined,
      });
    }
  }

  /**
   * Adds a region manager role to a user.
   *
   * This method is used to add the region manager role to a user.
   * If the user already has the region manager role, this method updates the regionIds.
   *
   * @param uid - The ID of the user.
   * @param regionIds - An array of region IDs.
   * @returns A Promise that resolves when the region manager role is added to the user.
   */
  async addRegionManagerRole(uid: string, regionId: number): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);
    const userRoles = user.customClaims?.roles || [];
    const managerRegions = user.customClaims?.managerRegions || [];

    if (!userRoles.includes(Role.RegionManager)) {
      userRoles.push(Role.RegionManager);
    }

    if (!managerRegions.includes(regionId)) {
      managerRegions.push(regionId);
    }

    await this.firebaseService.auth.setCustomUserClaims(uid, {
      ...user.customClaims,
      roles: userRoles,
      managerRegions,
    });
    this.logger.log(
      `Added region manager role to user ${uid} with regionIds ${managerRegions}`,
    );
  }

  /**
   * Removes the region manager role from spcified region.
   *
   * This method is used to remove the region manager role from a user.
   * If regionId is provided, it removes the region from the user's managerRegions.
   * If regionId is not provided, it removes all regions from the user's managerRegions.
   * If the user does not have the region manager role, this method does nothing.
   *
   *
   * @param uid - The ID of the user.
   * @param regionId - The ID of the region to remove from the user's managerRegions.
   * @returns A Promise that resolves when the region manager role is removed from the user.
   */
  async removeRegionManagerRole(uid: string, regionId?: number): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);
    const userRoles: Role[] = user.customClaims?.roles || [];
    const roleIndex = userRoles.indexOf(Role.RegionManager);

    if (roleIndex !== -1) {
      let managerRegions: number[] = [];

      if (regionId) {
        managerRegions = user.customClaims?.managerRegions || [];
        const regionIndex = managerRegions.indexOf(regionId);
        if (regionIndex !== -1) {
          managerRegions.splice(regionIndex, 1);
        }
      }

      if (managerRegions.length === 0) {
        userRoles.splice(roleIndex, 1);
        managerRegions = undefined;
      }

      await this.firebaseService.auth.setCustomUserClaims(uid, {
        ...user.customClaims,
        roles: userRoles,
        managerRegions,
      });
      if (regionId) {
        this.logger.log(
          `Removed region manager role from user ${uid} for region ${regionId}`,
        );
      } else {
        this.logger.log(`Removed region manager role from user ${uid}`);
      }
    } else if (user.customClaims?.managerRegions) {
      this.logger.warn(
        `User ${uid} does not have the region manager role but has managerRegions. Removing managerRegions.`,
      );
      await this.firebaseService.auth.setCustomUserClaims(uid, {
        ...user.customClaims,
        managerRegions: undefined,
      });
    }
  }
}
