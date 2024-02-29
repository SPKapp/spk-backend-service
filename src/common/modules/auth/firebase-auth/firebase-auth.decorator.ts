import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';

export const ROLES_KEY = 'roles';
export const FirebaseAuth = (...roles: string[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(FirebaseAuthGuard));
