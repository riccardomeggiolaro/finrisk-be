/* eslint-disable prettier/prettier */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class IsAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming you have user info attached to the request

    // Check if the user is an admin
    if (user && user.role === 'admin') {
        return true;
    }

    throw new ForbiddenException('Only admins can access this resource');
  }
}
