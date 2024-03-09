import { ForbiddenException, Injectable } from '@nestjs/common';

import { UserDetails } from './current-user/current-user';
import { Role } from './roles.eum';

@Injectable()
export class AuthService {
  async checkRegionManagerPermissions(
    user: UserDetails,
    fn: () => Promise<number>,
    forbiddenDescription: string = 'Region ID does not match the Region Manager permissions.',
  ): Promise<void> {
    if (user.roles.includes(Role.RegionManager)) {
      if (!user.regions.includes(await fn())) {
        throw new ForbiddenException(forbiddenDescription);
      }
    }
  }
}
