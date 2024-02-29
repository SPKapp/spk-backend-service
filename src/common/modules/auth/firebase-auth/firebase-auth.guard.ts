import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

import { FirebaseService } from '../../firebase/firebase.service';
import { Role } from '../roles.eum';
import { ROLES_KEY } from './firebase-auth.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseService: FirebaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let claims: DecodedIdToken;

    try {
      claims = await this.firebaseService.auth.verifyIdToken(
        this.extractTokenFromHeader(this.getRequest(context)),
      );
    } catch {
      throw new UnauthorizedException();
    }

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

  private getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
