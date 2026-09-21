import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access an endpoint.
 * Usage: @Roles(Role.ADMIN) or @Roles(Role.ADMIN, Role.USER)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
