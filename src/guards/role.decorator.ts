import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../auth/entities/user.entity.js';

//The key should be the same as defined in the payload
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);