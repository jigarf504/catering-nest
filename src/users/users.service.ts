import {
    ConflictException,
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Fields to exclude from user responses (never expose password/refreshToken)
const USER_SELECT_FIELDS = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class UsersService {
    private readonly SALT_ROUNDS = 10;

    constructor(private readonly prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        // Check for duplicate email
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('A user with this email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(
            createUserDto.password,
            this.SALT_ROUNDS,
        );

        // Create the user and return without password
        return this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
            },
            select: USER_SELECT_FIELDS,
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            select: USER_SELECT_FIELDS,
        });
    }

    async findOne(id: string) {
        this.validateObjectId(id);

        const user = await this.prisma.user.findUnique({
            where: { id },
            select: USER_SELECT_FIELDS,
        });

        if (!user) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        return user;
    }

    /**
     * Find a user by email — includes password for auth verification.
     * Internal use only (never expose password to API consumers).
     */
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Store hashed refresh token for token rotation.
     * Pass null to clear the token on logout.
     */
    async updateRefreshToken(userId: string, hashedRefreshToken: string | null) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefreshToken },
        });
    }

    /**
     * Find user by ID — includes refreshToken for rotation validation.
     * Internal use only.
     */
    async findByIdWithToken(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        this.validateObjectId(id);

        // Verify user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        // Check for email conflict if email is being updated
        if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const emailTaken = await this.prisma.user.findUnique({
                where: { email: updateUserDto.email },
            });

            if (emailTaken) {
                throw new ConflictException('A user with this email already exists');
            }
        }

        // Re-hash password if it was updated
        const data: Record<string, unknown> = { ...updateUserDto };
        if (updateUserDto.password) {
            data.password = await bcrypt.hash(
                updateUserDto.password,
                this.SALT_ROUNDS,
            );
        }

        return this.prisma.user.update({
            where: { id },
            data,
            select: USER_SELECT_FIELDS,
        });
    }

    async remove(id: string) {
        this.validateObjectId(id);

        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        await this.prisma.user.delete({
            where: { id },
        });

        return { message: `User with ID "${id}" has been deleted` };
    }

    /**
     * Validates that a string is a valid MongoDB ObjectId (24-character hex string).
     */
    private validateObjectId(id: string): void {
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;
        if (!objectIdRegex.test(id)) {
            throw new BadRequestException(
                `"${id}" is not a valid MongoDB ObjectId`,
            );
        }
    }
}
