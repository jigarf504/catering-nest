import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<import("./auth.service").Tokens>;
    login(loginDto: LoginDto): Promise<import("./auth.service").Tokens>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<import("./auth.service").Tokens>;
    getProfile(userId: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
