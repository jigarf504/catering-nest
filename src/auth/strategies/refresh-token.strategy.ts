import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(configService: ConfigService) {
        const secret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: true,
        });
    }

    /**
     * Extracts the raw refresh token from the Authorization header
     * and attaches both the payload and raw token to `request.user`.
     */
    validate(req: Request, payload: JwtPayload) {
        const authHeader = req.get('Authorization');
        const refreshToken = authHeader?.replace('Bearer ', '').trim();
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            refreshToken,
        };
    }
}
