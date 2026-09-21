import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';
declare const AccessTokenStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class AccessTokenStrategy extends AccessTokenStrategy_base {
    private readonly usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
export {};
