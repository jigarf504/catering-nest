import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Get required roles from the @Roles() decorator
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No roles required → allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('Access denied: no role assigned');
        }

        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied: requires one of [${requiredRoles.join(', ')}]`,
            );
        }

        return true;
    }
}
