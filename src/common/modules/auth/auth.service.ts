import { ForbiddenException, Injectable } from '@nestjs/common';

import { UserDetails } from './current-user/current-user';
import { Role } from './roles.eum';

@Injectable()
export class AuthService {
  async checkRegionManagerPermissions(
    user: UserDetails,
    fn: () => Promise<number | number[]>,
    forbiddenDescription: string = 'Region ID does not match the Region Manager permissions.',
  ): Promise<void> {
    if (user.roles.includes(Role.RegionManager)) {
      let regionsIds = await fn();
      if (!Array.isArray(regionsIds)) {
        regionsIds = [regionsIds];
      }

      if (!regionsIds.every((id) => user.regions.includes(id))) {
        throw new ForbiddenException(forbiddenDescription);
      }
    }
  }
}
