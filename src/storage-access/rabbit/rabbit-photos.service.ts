import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { StorageConfig } from '../../config';
import { UserDetails } from '../../common/modules/auth';
import { RabbitPhotosAccessType } from '../../rabbits';

@Injectable()
export class RabbitPhotosService {
  private readonly logger = new Logger(RabbitPhotosService.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(StorageConfig.KEY)
    private readonly storageConfig: ConfigType<typeof StorageConfig>,
  ) {}

  async generateToken(
    rabbitId: number,
    currentUser: UserDetails,
    accessType: RabbitPhotosAccessType,
  ): Promise<string> {
    if (accessType === RabbitPhotosAccessType.Deny) {
      this.logger.warn(
        `Trying to generate token with access type: ${accessType}`,
      );
      throw new InternalServerErrorException('Invalid token access type.');
    }

    let type: boolean | string;
    if (accessType === RabbitPhotosAccessType.Full) {
      type = true;
    } else if (accessType === RabbitPhotosAccessType.Own) {
      type = 'own';
    }

    return this.jwtService.sign({
      uid: currentUser.id,
      claims: {
        expiresAt: Date.now() + this.storageConfig.tokenValidTime * 1000,

        rabbit: {
          id: rabbitId.toString(),
          photos: type,
        },
      },
    });
  }
}
