import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

import { getGqlRequest } from '../../../functions/gql.functions';

import { FirebaseService } from '../../firebase/firebase.service';
import { Role } from '../roles.eum';
import { ROLES_KEY } from './firebase-auth.decorator';
import { UserDetails } from '../current-user/current-user';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseService: FirebaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getGqlRequest(context);
    let claims: DecodedIdToken;

    try {
      claims = await this.firebaseService.auth.verifyIdToken(
        this.extractTokenFromHeader(request),
      );
    } catch {
      throw new UnauthorizedException();
    }
    // claims.roles = [Role.RegionManager]; //TODO: Remove testing data
    claims.roles = [Role.Admin]; //TODO: Remove testing data

    request.user = new UserDetails({
      uid: claims.uid,
      email: claims.email,
      roles: claims.roles || [],
      phone: claims.phone_number,
      // regions: claims.regions
      regions: [2, 10], //TODO: Remove testing data
    });

    const requiredRoles: Role[] = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles.length) {
      return true;
    }

    if (!requiredRoles.some((role) => claims.roles?.includes(role))) {
      throw new ForbiddenException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
