import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';

import { FirebaseAuthGuard } from './firebase-auth.guard';
import { Role } from '../roles.eum';

export const ROLES_KEY = 'roles';
export const FirebaseAuth = (...roles: Role[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(FirebaseAuthGuard));
