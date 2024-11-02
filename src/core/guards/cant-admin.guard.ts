/* eslint-disable prettier/prettier */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CantAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming you have user info attached to the request

    // Check if the user is an admin
    if (user && user.role === 'admin') {
      throw new ForbiddenException('Admins cannot access this resource');
    }

    return true; // Allow access for non-admin users
  }
}
