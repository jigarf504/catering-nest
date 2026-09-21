import { Test, TestingModule } from '@nestjs/testing';
import {
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// ─── Mock Data ───────────────────────────────────────────────────

const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'john@example.com',
    password: '$2b$10$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as const,
    refreshToken: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
};

const mockUserWithoutSensitive = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: mockUser.role,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
};

// ─── Mock PrismaService ──────────────────────────────────────────

const mockPrismaService = {
    user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};

describe('UsersService', () => {
    let service: UsersService;
    let prisma: typeof mockPrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get(PrismaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ═══════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════

    describe('create', () => {
        const createUserDto = {
            email: 'john@example.com',
            password: 'Password123!',
            firstName: 'John',
            lastName: 'Doe',
        };

        it('should create a new user and return without password', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUserWithoutSensitive);

            const result = await service.create(createUserDto);

            expect(result).toEqual(mockUserWithoutSensitive);
            expect(result).not.toHaveProperty('password');
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: createUserDto.email },
            });
            expect(prisma.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        email: createUserDto.email,
                        firstName: createUserDto.firstName,
                        lastName: createUserDto.lastName,
                    }),
                }),
            );
        });

        it('should hash the password before saving', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUserWithoutSensitive);

            await service.create(createUserDto);

            const createCall = prisma.user.create.mock.calls[0][0];
            const savedPassword = createCall.data.password;

            // Verify it's a bcrypt hash (not plaintext)
            expect(savedPassword).not.toBe(createUserDto.password);
            expect(savedPassword).toMatch(/^\$2[aby]\$/);

            // Verify the hash matches the original password
            const isMatch = await bcrypt.compare(createUserDto.password, savedPassword);
            expect(isMatch).toBe(true);
        });

        it('should throw ConflictException if email already exists', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.create(createUserDto)).rejects.toThrow(
                ConflictException,
            );
            await expect(service.create(createUserDto)).rejects.toThrow(
                'A user with this email already exists',
            );
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // FIND ALL
    // ═══════════════════════════════════════════════════════════════

    describe('findAll', () => {
        it('should return an array of users without passwords', async () => {
            const users = [mockUserWithoutSensitive];
            prisma.user.findMany.mockResolvedValue(users);

            const result = await service.findAll();

            expect(result).toEqual(users);
            expect(result[0]).not.toHaveProperty('password');

            // Verify that Prisma select does NOT include password
            const selectArg = prisma.user.findMany.mock.calls[0][0].select;
            expect(selectArg).not.toHaveProperty('password');
            expect(selectArg).toHaveProperty('id', true);
            expect(selectArg).toHaveProperty('email', true);
        });

        it('should return an empty array when no users exist', async () => {
            prisma.user.findMany.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // FIND ONE
    // ═══════════════════════════════════════════════════════════════

    describe('findOne', () => {
        it('should return a single user without password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUserWithoutSensitive);

            const result = await service.findOne(mockUser.id);

            expect(result).toEqual(mockUserWithoutSensitive);
            expect(result).not.toHaveProperty('password');
        });

        it('should throw NotFoundException if user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.findOne('507f1f77bcf86cd799439099'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for invalid ObjectId', async () => {
            await expect(service.findOne('invalid-id')).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.findOne('invalid-id')).rejects.toThrow(
                'is not a valid MongoDB ObjectId',
            );
        });

        it('should throw BadRequestException for short ObjectId', async () => {
            await expect(service.findOne('507f1f77bcf8')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException for ObjectId with invalid characters', async () => {
            await expect(
                service.findOne('507f1f77bcf86cd79943901z'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════════

    describe('update', () => {
        const updateUserDto = { firstName: 'Jane' };

        it('should update and return the user without password', async () => {
            const updatedUser = { ...mockUserWithoutSensitive, firstName: 'Jane' };
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.user.update.mockResolvedValue(updatedUser);

            const result = await service.update(mockUser.id, updateUserDto);

            expect(result.firstName).toBe('Jane');
            expect(result).not.toHaveProperty('password');
        });

        it('should re-hash password when password is updated', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.user.update.mockResolvedValue(mockUserWithoutSensitive);

            await service.update(mockUser.id, { password: 'NewPassword123!' });

            const updateCall = prisma.user.update.mock.calls[0][0];
            const updatedPassword = updateCall.data.password;

            expect(updatedPassword).not.toBe('NewPassword123!');
            expect(updatedPassword).toMatch(/^\$2[aby]\$/);
        });

        it('should throw NotFoundException if user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.update('507f1f77bcf86cd799439099', updateUserDto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if updated email already taken', async () => {
            const anotherUser = { ...mockUser, id: '507f1f77bcf86cd799439022' };
            prisma.user.findUnique
                .mockResolvedValueOnce(mockUser) // User exists
                .mockResolvedValueOnce(anotherUser); // Email already taken

            await expect(
                service.update(mockUser.id, { email: 'taken@example.com' }),
            ).rejects.toThrow(ConflictException);
        });

        it('should not check email conflict if email unchanged', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.user.update.mockResolvedValue(mockUserWithoutSensitive);

            await service.update(mockUser.id, { email: mockUser.email });

            // findUnique called once for existence check, no second call for email check
            expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        });

        it('should throw BadRequestException for invalid ObjectId', async () => {
            await expect(
                service.update('not-valid', updateUserDto),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // REMOVE
    // ═══════════════════════════════════════════════════════════════

    describe('remove', () => {
        it('should delete the user and return a success message', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.user.delete.mockResolvedValue(mockUser);

            const result = await service.remove(mockUser.id);

            expect(result).toEqual({
                message: `User with ID "${mockUser.id}" has been deleted`,
            });
            expect(prisma.user.delete).toHaveBeenCalledWith({
                where: { id: mockUser.id },
            });
        });

        it('should throw NotFoundException if user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.remove('507f1f77bcf86cd799439099'),
            ).rejects.toThrow(NotFoundException);
            expect(prisma.user.delete).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid ObjectId', async () => {
            await expect(service.remove('bad-id')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // FIND BY EMAIL (auth helper)
    // ═══════════════════════════════════════════════════════════════

    describe('findByEmail', () => {
        it('should return user with password when found', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.findByEmail('john@example.com');

            expect(result).toEqual(mockUser);
            expect(result).toHaveProperty('password');
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'john@example.com' },
            });
        });

        it('should return null when user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await service.findByEmail('noone@example.com');

            expect(result).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // UPDATE REFRESH TOKEN
    // ═══════════════════════════════════════════════════════════════

    describe('updateRefreshToken', () => {
        it('should update the refresh token', async () => {
            prisma.user.update.mockResolvedValue(mockUser);

            await service.updateRefreshToken(mockUser.id, 'hashed-token');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { refreshToken: 'hashed-token' },
            });
        });

        it('should set refresh token to null on logout', async () => {
            prisma.user.update.mockResolvedValue(mockUser);

            await service.updateRefreshToken(mockUser.id, null);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { refreshToken: null },
            });
        });
    });
});
