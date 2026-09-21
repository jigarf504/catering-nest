import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        const secret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    /**
     * Passport calls this after verifying the JWT signature & expiration.
     * The returned object is attached to `request.user`.
     */
    async validate(payload: JwtPayload) {
        const user = await this.usersService.findOne(payload.sub);
        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
