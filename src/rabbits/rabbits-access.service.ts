import { Injectable, Logger } from '@nestjs/common';

import { Role, UserDetails } from '../common/modules/auth';

import { RabbitsService } from './rabbits/rabbits.service';
import { RabbitGroupsService } from './rabbit-groups/rabbit-groups.service';

@Injectable()
export class RabbitsAccessService {
  logger = new Logger(RabbitsAccessService.name);

  constructor(
    private readonly rabbitsService: RabbitsService,
    private readonly rabbitGroupsService: RabbitGroupsService,
  ) {}

  /**
   * Validates if the current user has access to the rabbit.
   *
   * Access is granted if the user has one of the following roles:
   * - Admin
   * - Region Manager - Region Manager can access rabbits in their region.
   * - Region Observer - Region Observer can access rabbits in their region, but cannot edit them.
   * - Volunteer - Volunteer can access rabbits in their team.
   *
   * @param rabbitId - The ID of the rabbit to validate access for.
   * @param currentUser - The details of the current user.
   * @param editable - Whether the user needs edit access.
   */
  async validateAccess(
    rabbitId: number,
    currentUser: UserDetails,
    editable: boolean = false,
  ): Promise<boolean> {
    let regionIds: number[] | undefined;
    let teamIds: number[] | undefined;
    // TODO: Refactor this

    if (currentUser.checkRole(Role.Admin)) {
      return true;
    }

    if (
      !editable &&
      currentUser.checkRole([Role.RegionManager, Role.RegionObserver])
    ) {
      regionIds = currentUser.regions;
    } else if (currentUser.checkRole(Role.RegionManager)) {
      regionIds = currentUser.managerRegions;
    } else if (currentUser.checkRole(Role.RegionObserver) && !editable) {
      regionIds = currentUser.observerRegions;
    } else if (currentUser.checkRole(Role.Volunteer)) {
      teamIds = [currentUser.teamId];
    } else {
      return false;
    }

    const rabbit = await this.rabbitsService.findOne(
      rabbitId,
      regionIds,
      teamIds,
    );
    return rabbit !== null;
  }

  async validateAccessForRabbitGroup(
    rabbitGroupId: number,
    currentUser: UserDetails,
  ): Promise<boolean> {
    let regionIds: number[] | undefined;
    // TODO: Refactor this

    if (currentUser.checkRole(Role.Admin)) {
      return true;
    }
    if (currentUser.checkRole(Role.RegionManager)) {
      regionIds = currentUser.managerRegions;
    } else {
      return false;
    }

    const rabbitGroup = await this.rabbitGroupsService.findOne(
      rabbitGroupId,
      regionIds,
    );
    return rabbitGroup !== null;
  }

  /**
   * Grants access to the user to view photos of the rabbit.
   *
   * Access is granted if the user
   * - is an Admin and the rabbit exists
   * - is a Region Manager or Region Observer and the rabbit exists in their region
   * - is a Volunteer and the rabbit exists in their team
   *
   * @param rabbitId - The ID of the rabbit to grant access to.
   * @param currentUser - The details of the current user.
   * @returns The type of access the user has to the rabbit's photos.
   */
  async grantPhotoAccess(
    rabbitId: number,
    currentUser: UserDetails,
  ): Promise<RabbitPhotosAccessType> {
    if (currentUser.checkRole(Role.Admin)) {
      return (await this.rabbitsService.exists(rabbitId))
        ? RabbitPhotosAccessType.Full
        : RabbitPhotosAccessType.Deny;
    }

    if (
      currentUser.checkRole([Role.RegionManager, Role.RegionObserver]) &&
      (await this.rabbitsService.exists(rabbitId, currentUser.regions))
    ) {
      return RabbitPhotosAccessType.Full;
    }

    if (
      currentUser.checkRole(Role.Volunteer) &&
      (await this.rabbitsService.exists(rabbitId, undefined, [
        currentUser.teamId,
      ]))
    ) {
      return RabbitPhotosAccessType.Own;
    }

    return RabbitPhotosAccessType.Deny;
  }
}

/**
 * The type of access the user has to the rabbit's photos.
 */
export enum RabbitPhotosAccessType {
  /**
   * The user has access read all photos and edit only their own photos.
   */
  Own,
  /**
   * The user has full access to the rabbit's photos.
   */
  Full,
  /**
   * The user does not have access to the rabbit's photos.
   */
  Deny,
}
