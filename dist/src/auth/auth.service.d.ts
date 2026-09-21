import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export interface Tokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly SALT_ROUNDS;
    constructor(prisma: PrismaService, usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<Tokens>;
    login(loginDto: LoginDto): Promise<Tokens>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<Tokens>;
    getProfile(userId: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private generateTokens;
    private storeRefreshToken;
}
