import { Injectable, Logger } from '@nestjs/common';

import { FirebaseService } from '../../firebase/firebase.service';

import { Role } from '../roles.eum';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

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
   * Adds a role to a user.
   *
   * This method is used to add a role to a user.
   * If the role is a Region Manager or Region Observer, the additional information is the region ID.
   * If the role is a Volunteer, the additional information is the team ID.
   *
   * @param uid - The ID of the user.
   * @param role - The role to be added.
   * @param aditionalInfo - The additional information required for the role.
   * @returns A Promise that resolves when the role is successfully added.
   */
  async addRoleToUser(
    uid: string,
    role: Role,
    aditionalInfo?: number,
  ): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);

    switch (role) {
      case Role.Admin:
        await this.addAdminRole(user);
        break;
      case Role.RegionManager:
        if (!aditionalInfo) {
          throw new Error('Additional information is required for this role.');
        }
        await this.addRegionManagerRole(user, aditionalInfo);
        break;

      case Role.RegionObserver:
        if (!aditionalInfo) {
          throw new Error('Additional information is required for this role.');
        }
        await this.addRegionObserverRole(user, aditionalInfo);
        break;
      case Role.Volunteer:
        if (!aditionalInfo) {
          throw new Error('Additional information is required for this role.');
        }
        this.addVolunteerRole(user, aditionalInfo);
        break;
    }
  }

  /**
   * Removes a role from a user.
   *
   * This method is used to remove a role from a user.
   * If the role is a Region Manager or Region Observer, the additional information is the region ID.
   *       If the region ID is not provided, all regions are removed.
   *
   * @param uid - The ID of the user.
   * @param role - The role to be removed.
   * @param aditionalInfo - The additional information required for the role.
   * @returns A Promise that resolves when the role is successfully removed.
   */
  async removeRoleFromUser(
    uid: string,
    role: Role,
    aditionalInfo?: number,
  ): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);

    switch (role) {
      case Role.Admin:
        await this.removeAdminRole(user);
        break;
      case Role.RegionManager:
        await this.removeRegionManagerRole(user, aditionalInfo);
        break;
      case Role.RegionObserver:
        await this.removeRegionObserverRole(user, aditionalInfo);
        break;
      case Role.Volunteer:
        await this.removeVolunteerRole(user);
        break;
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
  private async addVolunteerRole(
    user: UserRecord,
    teamId: number,
  ): Promise<void> {
    const userRoles = user.customClaims?.roles || [];

    if (!userRoles.includes(Role.Volunteer)) {
      userRoles.push(Role.Volunteer);
    }

    await this.firebaseService.auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      roles: userRoles,
      teamId: teamId,
    });
    this.logger.log(
      `Added volunteer role to user ${user.uid} with teamId ${teamId}`,
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
  private async removeVolunteerRole(user: UserRecord): Promise<void> {
    const userRoles: Role[] = user.customClaims?.roles || [];
    const roleIndex = userRoles.indexOf(Role.Volunteer);

    if (roleIndex !== -1) {
      userRoles.splice(roleIndex, 1);
      await this.firebaseService.auth.setCustomUserClaims(user.uid, {
        ...user.customClaims,
        roles: userRoles,
        teamId: undefined,
      });
      this.logger.log(`Removed volunteer role from user ${user.uid}`);
    } else if (user.customClaims?.teamId) {
      this.logger.warn(
        `User ${user.uid} does not have the volunteer role but has a teamId. Removing teamId.`,
      );
      await this.firebaseService.auth.setCustomUserClaims(user.uid, {
        ...user.customClaims,
        teamId: undefined,
      });
    }
  }

  /**
   * Adds a region manager role to a user.
   *
   * This method is used to add the region manager role with the specified region to a user.
   *
   * @param uid - The ID of the user.
   * @param regionId - The ID of the region to add to the user's managerRegions.
   * @returns A Promise that resolves when the region manager role is added to the user.
   */
  private async addRegionManagerRole(
    user: UserRecord,
    regionId: number,
  ): Promise<void> {
    const userRoles = user.customClaims?.roles || [];
    const managerRegions = user.customClaims?.managerRegions || [];

    if (!userRoles.includes(Role.RegionManager)) {
      userRoles.push(Role.RegionManager);
    }

    if (!managerRegions.includes(regionId)) {
      managerRegions.push(regionId);
    }

    await this.firebaseService.auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      roles: userRoles,
      managerRegions,
    });
    this.logger.log(
      `Added region manager role to user ${user.uid} with regionIds ${managerRegions}`,
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
  private async removeRegionManagerRole(
    user: UserRecord,
    regionId?: number,
  ): Promise<void> {
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

      await this.firebaseService.auth.setCustomUserClaims(user.uid, {
        ...user.customClaims,
        roles: userRoles,
        managerRegions,
      });
      if (regionId) {
        this.logger.log(
          `Removed region manager role from user ${user.uid} for region ${regionId}`,
        );
      } else {
        this.logger.log(`Removed region manager role from user ${user.uid}`);
      }
    } else if (user.customClaims?.managerRegions) {
      this.logger.warn(
        `User ${user.uid} does not have the region manager role but has managerRegions. Removing managerRegions.`,
      );
      await this.firebaseService.auth.setCustomUserClaims(user.uid, {
        ...user.customClaims,
        managerRegions: undefined,
      });
    }
  }

  /**
   * Adds a region observer role to a user.
   *
   * This method is used to add the region observer role with the specified region to a user.
   *
   * @param uid - The ID of the user.
   * @param regionId - The ID of the region to add to the user's observerRegions.
   * @returns A Promise that resolves when the region observer role is added to the user.
   */
  private async addRegionObserverRole(
    user: UserRecord,
    regionId: number,
  ): Promise<void> {
    const userRoles = user.customClaims?.roles || [];
    const observerRegions = user.customClaims?.observerRegions || [];

    if (!userRoles.includes(Role.RegionObserver)) {
      userRoles.push(Role.RegionObserver);
    }

    if (!observerRegions.includes(regionId)) {
      observerRegions.push(regionId);
    }

    await this.firebaseService.auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      roles: userRoles,
      observerRegions,
    });
    this.logger.log(
      `Added region observer role to user ${user.uid} with regionIds ${observerRegions}`,
    );
  }

  /**
   * Removes the region observer role from spcified region.
   *
   * This method is used to remove the region observer role from a user.
   * If regionId is provided, it removes the region from the user's observerRegions.
   * If regionId is not provided, it removes all regions from the user's observerRegions.
   * If the user does not have the region observer role, this method does nothing.
   *
   *
   * @param uid - The ID of the user.
   * @param regionId - The ID of the region to remove from the user's observerRegions.
   * @returns A Promise that resolves when the region observer role is removed from the user.
   */
  private async removeRegionObserverRole(
    user: UserRecord,
    regionId?: number,
  ): Promise<void> {
    const userRoles: Role[] = user.customClaims?.roles || [];
    const roleIndex = userRoles.indexOf(Role.RegionObserver);

    if (roleIndex !== -1) {
      let observerRegions: number[] = [];

      if (regionId) {
        observerRegions = user.customClaims?.observerRegions || [];
        const regionIndex = observerRegions.indexOf(regionId);
        if (regionIndex !== -1) {
          observerRegions.splice(regionIndex, 1);
        }
      }

      if (observerRegions.length === 0) {
        userRoles.splice(roleIndex, 1);
        observerRegions = undefined;
      }

      await this.firebaseService.auth.setCustomUserClaims(user.uid, {
        ...user.customClaims,
        roles: userRoles,
        observerRegions,
      });
      if (regionId) {
        this.logger.log(
          `Removed region observer role from user ${user.uid} for region ${regionId}`,
        );
      } else {
        this.logger.log(`Removed region observer role from user ${user.uid}`);
      }
    } else if (user.customClaims?.observerRegions) {
      this.logger.warn(
        `User ${user.uid} does not have the region observer role but has observerRegions. Removing observerRegions.`,
      );
      await this.firebaseService.auth.setCustomUserClaims(user.uid, {
        ...user.customClaims,
        observerRegions: undefined,
      });
    }
  }

  /**
   * Adds the admin role to a user.
   *
   * @param user - The user to add the admin role to.
   * @returns A Promise that resolves when the admin role is added to the user.
   */
  private async addAdminRole(user: UserRecord): Promise<void> {
    const userRoles = user.customClaims?.roles || [];

    if (!userRoles.includes(Role.Admin)) {
      userRoles.push(Role.Admin);
    }

    await this.firebaseService.auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      roles: userRoles,
    });
    this.logger.log(`Added admin role to user ${user.uid}`);
  }

  /**
   * Removes the admin role from a user.
   *
   * @param user - The user to remove the admin role from.
   * @returns A Promise that resolves when the admin role is removed from the user.
   */
  private async removeAdminRole(user: UserRecord): Promise<void> {
    const userRoles: Role[] = user.customClaims?.roles || [];
    const roleIndex = userRoles.indexOf(Role.Admin);

    if (roleIndex !== -1) {
      userRoles.splice(roleIndex, 1);
      await this.firebaseService.auth.setCustomUserClaims(user.uid, {
        ...user.customClaims,
        roles: userRoles,
      });
      this.logger.log(`Removed admin role from user ${user.uid}`);
    }
  }
}
