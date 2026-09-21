import { Test, TestingModule } from '@nestjs/testing';
import {
    ConflictException,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// ─── Mock Data ───────────────────────────────────────────────────

const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'john@example.com',
    password: '$2b$10$mockedhashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as const,
    refreshToken: null as string | null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
};

const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
};

// ─── Mock Services ───────────────────────────────────────────────

const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    findByIdWithToken: jest.fn(),
    updateRefreshToken: jest.fn(),
    create: jest.fn(),
};

const mockPrismaService = {
    user: {
        create: jest.fn(),
    },
};

const mockJwtService = {
    signAsync: jest.fn(),
};

const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
            JWT_ACCESS_SECRET: 'test-access-secret',
            JWT_REFRESH_SECRET: 'test-refresh-secret',
            JWT_ACCESS_EXPIRATION: '15m',
            JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key];
    }),
};

describe('AuthService', () => {
    let service: AuthService;
    let usersService: typeof mockUsersService;
    let prisma: typeof mockPrismaService;
    let jwtService: typeof mockJwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get(UsersService);
        prisma = module.get(PrismaService);
        jwtService = module.get(JwtService);

        jest.clearAllMocks();

        // Default mock for signAsync
        jwtService.signAsync
            .mockResolvedValueOnce(mockTokens.accessToken)
            .mockResolvedValueOnce(mockTokens.refreshToken);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ═══════════════════════════════════════════════════════════════
    // REGISTER
    // ═══════════════════════════════════════════════════════════════

    describe('register', () => {
        const registerDto = {
            email: 'newuser@example.com',
            password: 'StrongPass123!',
            firstName: 'New',
            lastName: 'User',
        };

        it('should register a new user and return tokens', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                ...mockUser,
                email: registerDto.email,
            });
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            const result = await service.register(registerDto);

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
            expect(prisma.user.create).toHaveBeenCalled();
        });

        it('should hash the password before storing', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUser);
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            await service.register(registerDto);

            const createCall = prisma.user.create.mock.calls[0][0];
            const storedPassword = createCall.data.password;

            // Should be a bcrypt hash, not plaintext
            expect(storedPassword).not.toBe(registerDto.password);
            expect(storedPassword).toMatch(/^\$2[aby]\$/);
        });

        it('should throw ConflictException if email already exists', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);

            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
            await expect(service.register(registerDto)).rejects.toThrow(
                'A user with this email already exists',
            );
            expect(prisma.user.create).not.toHaveBeenCalled();
        });

        it('should store hashed refresh token after registration', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUser);
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            await service.register(registerDto);

            expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
                expect.any(String), // hashed refresh token
            );
        });

        it('should generate both access and refresh tokens', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUser);
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            await service.register(registerDto);

            expect(jwtService.signAsync).toHaveBeenCalledTimes(2);

            // Access token call
            expect(jwtService.signAsync).toHaveBeenCalledWith(
                expect.objectContaining({ sub: mockUser.id, email: mockUser.email }),
                expect.objectContaining({ secret: 'test-access-secret' }),
            );

            // Refresh token call
            expect(jwtService.signAsync).toHaveBeenCalledWith(
                expect.objectContaining({ sub: mockUser.id, email: mockUser.email }),
                expect.objectContaining({ secret: 'test-refresh-secret' }),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // LOGIN
    // ═══════════════════════════════════════════════════════════════

    describe('login', () => {
        const loginDto = {
            email: 'john@example.com',
            password: 'CorrectPassword123!',
        };

        it('should return tokens on successful login', async () => {
            const hashedPw = await bcrypt.hash(loginDto.password, 10);
            usersService.findByEmail.mockResolvedValue({
                ...mockUser,
                password: hashedPw,
            });
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            const result = await service.login(loginDto);

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
        });

        it('should throw UnauthorizedException if email not found', async () => {
            usersService.findByEmail.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.login(loginDto)).rejects.toThrow(
                'Invalid email or password',
            );
        });

        it('should throw UnauthorizedException if password is wrong', async () => {
            usersService.findByEmail.mockResolvedValue({
                ...mockUser,
                password: await bcrypt.hash('DifferentPassword', 10),
            });

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should not reveal whether email or password is wrong', async () => {
            // Email not found
            usersService.findByEmail.mockResolvedValue(null);
            try {
                await service.login(loginDto);
            } catch (err: any) {
                expect(err.message).toBe('Invalid email or password');
            }

            // Wrong password
            usersService.findByEmail.mockResolvedValue({
                ...mockUser,
                password: await bcrypt.hash('different', 10),
            });
            try {
                await service.login(loginDto);
            } catch (err: any) {
                expect(err.message).toBe('Invalid email or password');
            }
        });

        it('should store hashed refresh token after login', async () => {
            const hashedPw = await bcrypt.hash(loginDto.password, 10);
            usersService.findByEmail.mockResolvedValue({
                ...mockUser,
                password: hashedPw,
            });
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            await service.login(loginDto);

            expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
                expect.any(String),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // LOGOUT
    // ═══════════════════════════════════════════════════════════════

    describe('logout', () => {
        it('should clear the refresh token and return success message', async () => {
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            const result = await service.logout(mockUser.id);

            expect(result).toEqual({ message: 'Logged out successfully' });
            expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
                null,
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // REFRESH TOKENS
    // ═══════════════════════════════════════════════════════════════

    describe('refreshTokens', () => {
        it('should return new token pair on valid refresh', async () => {
            const rawRefreshToken = 'valid-refresh-token';
            const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);

            usersService.findByIdWithToken.mockResolvedValue({
                ...mockUser,
                refreshToken: hashedRefreshToken,
            });
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            const result = await service.refreshTokens(mockUser.id, rawRefreshToken);

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
        });

        it('should throw ForbiddenException if user has no stored refresh token', async () => {
            usersService.findByIdWithToken.mockResolvedValue({
                ...mockUser,
                refreshToken: null,
            });

            await expect(
                service.refreshTokens(mockUser.id, 'any-token'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if user not found', async () => {
            usersService.findByIdWithToken.mockResolvedValue(null);

            await expect(
                service.refreshTokens(mockUser.id, 'any-token'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if refresh token does not match', async () => {
            const hashedToken = await bcrypt.hash('correct-token', 10);
            usersService.findByIdWithToken.mockResolvedValue({
                ...mockUser,
                refreshToken: hashedToken,
            });

            await expect(
                service.refreshTokens(mockUser.id, 'wrong-token'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should store new hashed refresh token (token rotation)', async () => {
            const rawRefreshToken = 'valid-refresh-token';
            const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);

            usersService.findByIdWithToken.mockResolvedValue({
                ...mockUser,
                refreshToken: hashedRefreshToken,
            });
            usersService.updateRefreshToken.mockResolvedValue(undefined);

            await service.refreshTokens(mockUser.id, rawRefreshToken);

            // Should store new hashed token
            expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
                expect.any(String),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // GET PROFILE
    // ═══════════════════════════════════════════════════════════════

    describe('getProfile', () => {
        it('should return the user profile', async () => {
            const profile = {
                id: mockUser.id,
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                role: mockUser.role,
            };
            usersService.findOne.mockResolvedValue(profile);

            const result = await service.getProfile(mockUser.id);

            expect(result).toEqual(profile);
            expect(result).not.toHaveProperty('password');
            expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
        });
    });
});
