import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserRole } from '../auth/entities/user.entity.js';
import { ROLES_KEY } from './role.decorator.js';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Reads the metadata of the method and the controller class and 
    // only allows passing if both have roles configured
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!allowedRoles?.length) {
      throw new ForbiddenException('No roles configured for this route');
    }

    // The AuthGuard runs first and puts the decoded JWT in the request, 
    //so RoleGuard can read straight from the request.user.
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user found!');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Only administrators have access to this functionality.',
      );
    }

    return true;
  }
}
