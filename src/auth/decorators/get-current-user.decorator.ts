import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user from the request.
 * Usage: @GetCurrentUser() user — gets entire user object
 * Usage: @GetCurrentUser('email') email — gets specific property
 */
export const GetCurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        if (!data) {
            return request.user;
        }
        return request.user?.[data];
    },
);
