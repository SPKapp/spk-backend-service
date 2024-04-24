import { Injectable, Logger } from '@nestjs/common';

import { Role, UserDetails } from '../common/modules/auth/auth.module';

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

    if (currentUser.checkRole(Role.Admin)) {
      return true;
    }
    if (currentUser.checkRole(Role.RegionManager)) {
      regionIds = currentUser.regions;
    } else if (currentUser.checkRole(Role.RegionObserver) && !editable) {
      regionIds = currentUser.regions;
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

    if (currentUser.checkRole(Role.Admin)) {
      return true;
    }
    if (currentUser.checkRole(Role.RegionManager)) {
      regionIds = currentUser.regions;
    } else {
      return false;
    }

    const rabbitGroup = await this.rabbitGroupsService.findOne(
      rabbitGroupId,
      regionIds,
    );
    return rabbitGroup !== null;
  }
}
