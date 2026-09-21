import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({}), // Signing options are passed per-call in AuthService
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AccessTokenStrategy,
        RefreshTokenStrategy,
    ],
    exports: [AuthService],
})
export class AuthModule { }
