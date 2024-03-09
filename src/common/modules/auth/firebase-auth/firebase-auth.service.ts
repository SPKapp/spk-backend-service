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
}
