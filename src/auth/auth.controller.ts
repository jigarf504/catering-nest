import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { GetCurrentUser } from './decorators/get-current-user.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /api/auth/register
     * Public — no JWT required.
     * Returns access + refresh tokens.
     */
    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    /**
     * POST /api/auth/login
     * Public — no JWT required.
     * Returns access + refresh tokens.
     */
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    /**
     * POST /api/auth/logout
     * Requires valid access token.
     * Clears the stored refresh token.
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@GetCurrentUser('id') userId: string) {
        return this.authService.logout(userId);
    }

    /**
     * POST /api/auth/refresh
     * Requires valid refresh token in Authorization header.
     * Returns new access + refresh token pair (token rotation).
     */
    @Public()
    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refreshTokens(
        @GetCurrentUser('id') userId: string,
        @GetCurrentUser('refreshToken') refreshToken: string,
    ) {
        return this.authService.refreshTokens(userId, refreshToken);
    }

    /**
     * GET /api/auth/profile
     * Requires valid access token.
     * Returns the authenticated user's profile (no password).
     */
    @Get('profile')
    @HttpCode(HttpStatus.OK)
    getProfile(@GetCurrentUser('id') userId: string) {
        return this.authService.getProfile(userId);
    }
}
