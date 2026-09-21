import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// ─── Mock Data ───────────────────────────────────────────────────

const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
};

const mockProfile = {
    id: '507f1f77bcf86cd799439011',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
};

// ─── Mock AuthService ────────────────────────────────────────────

const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
    getProfile: jest.fn(),
};

describe('AuthController', () => {
    let controller: AuthController;
    let service: typeof mockAuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        service = module.get(AuthService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // ═══════════════════════════════════════════════════════════════
    // POST /auth/register
    // ═══════════════════════════════════════════════════════════════

    describe('register', () => {
        it('should call authService.register and return tokens', async () => {
            const dto = {
                email: 'newuser@example.com',
                password: 'StrongPass123!',
                firstName: 'New',
                lastName: 'User',
            };
            service.register.mockResolvedValue(mockTokens);

            const result = await controller.register(dto);

            expect(result).toEqual(mockTokens);
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(service.register).toHaveBeenCalledWith(dto);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // POST /auth/login
    // ═══════════════════════════════════════════════════════════════

    describe('login', () => {
        it('should call authService.login and return tokens', async () => {
            const dto = {
                email: 'john@example.com',
                password: 'Password123!',
            };
            service.login.mockResolvedValue(mockTokens);

            const result = await controller.login(dto);

            expect(result).toEqual(mockTokens);
            expect(service.login).toHaveBeenCalledWith(dto);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // POST /auth/logout
    // ═══════════════════════════════════════════════════════════════

    describe('logout', () => {
        it('should call authService.logout with userId', async () => {
            const logoutMsg = { message: 'Logged out successfully' };
            service.logout.mockResolvedValue(logoutMsg);

            const result = await controller.logout('507f1f77bcf86cd799439011');

            expect(result).toEqual(logoutMsg);
            expect(service.logout).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // POST /auth/refresh
    // ═══════════════════════════════════════════════════════════════

    describe('refreshTokens', () => {
        it('should call authService.refreshTokens and return new tokens', async () => {
            service.refreshTokens.mockResolvedValue(mockTokens);

            const result = await controller.refreshTokens(
                '507f1f77bcf86cd799439011',
                'old-refresh-token',
            );

            expect(result).toEqual(mockTokens);
            expect(service.refreshTokens).toHaveBeenCalledWith(
                '507f1f77bcf86cd799439011',
                'old-refresh-token',
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // GET /auth/profile
    // ═══════════════════════════════════════════════════════════════

    describe('getProfile', () => {
        it('should return the user profile', async () => {
            service.getProfile.mockResolvedValue(mockProfile);

            const result = await controller.getProfile('507f1f77bcf86cd799439011');

            expect(result).toEqual(mockProfile);
            expect(result).not.toHaveProperty('password');
            expect(service.getProfile).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        });
    });
});
