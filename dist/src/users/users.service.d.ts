import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly SALT_ROUNDS;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        refreshToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    updateRefreshToken(userId: string, hashedRefreshToken: string | null): Promise<void>;
    findByIdWithToken(id: string): Promise<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        refreshToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private validateObjectId;
}
