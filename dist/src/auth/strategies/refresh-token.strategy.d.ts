import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
declare const RefreshTokenStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class RefreshTokenStrategy extends RefreshTokenStrategy_base {
    constructor(configService: ConfigService);
    validate(req: Request, payload: JwtPayload): {
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        refreshToken: string | undefined;
    };
}
export {};
