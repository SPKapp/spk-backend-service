import { Injectable, Logger } from '@nestjs/common';

import { Role, UserDetails } from '../common/modules/auth/auth.module';

import { RabbitsService } from './rabbits/rabbits.service';

@Injectable()
export class RabbitsAccessService {
  logger = new Logger(RabbitsAccessService.name);

  constructor(private readonly rabbitsService: RabbitsService) {}

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
}
