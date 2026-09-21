import {
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 10;

    constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    // ─── Register ────────────────────────────────────────────────────

    async register(registerDto: RegisterDto): Promise<Tokens> {
        // Check if email already exists
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('A user with this email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(
            registerDto.password,
            this.SALT_ROUNDS,
        );

        // Create the user directly via Prisma (avoid double-hashing in UsersService)
        const newUser = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password: hashedPassword,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens({
            sub: newUser.id,
            email: newUser.email,
            role: newUser.role,
        });

        // Store hashed refresh token
        await this.storeRefreshToken(newUser.id, tokens.refreshToken);

        return tokens;
    }

    // ─── Login ───────────────────────────────────────────────────────

    async login(loginDto: LoginDto): Promise<Tokens> {
        // Find user by email (includes password)
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Generate tokens
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        // Store hashed refresh token
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    // ─── Logout ──────────────────────────────────────────────────────

    async logout(userId: string): Promise<{ message: string }> {
        // Clear the stored refresh token
        await this.usersService.updateRefreshToken(userId, null);
        return { message: 'Logged out successfully' };
    }

    // ─── Refresh Tokens ──────────────────────────────────────────────

    async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
        // Get user with stored refresh token
        const user = await this.usersService.findByIdWithToken(userId);
        if (!user || !user.refreshToken) {
            throw new ForbiddenException('Access denied: no active session');
        }

        // Verify the provided refresh token matches the stored hash
        const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!tokenMatches) {
            throw new ForbiddenException('Access denied: invalid refresh token');
        }

        // Generate new token pair (token rotation)
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        // Store the new hashed refresh token
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    // ─── Get Profile ─────────────────────────────────────────────────

    async getProfile(userId: string) {
        return this.usersService.findOne(userId);
    }

    // ─── Private Helpers ─────────────────────────────────────────────

    /**
     * Generate an access + refresh token pair.
     */
    private async generateTokens(payload: JwtPayload): Promise<Tokens> {
        const accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
        const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
        const accessExp = this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRATION');
        const refreshExp = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRATION');

        const payloadObj = { sub: payload.sub, email: payload.email, role: payload.role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payloadObj, {
                secret: accessSecret,
                expiresIn: accessExp as any,
            }),
            this.jwtService.signAsync(payloadObj, {
                secret: refreshSecret,
                expiresIn: refreshExp as any,
            }),
        ]);

        return { accessToken, refreshToken };
    }

    /**
     * Hash and store a refresh token for the given user.
     */
    private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
        const hashedToken = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);
        await this.usersService.updateRefreshToken(userId, hashedToken);
    }
}
