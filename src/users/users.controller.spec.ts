import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// ─── Mock Data ───────────────────────────────────────────────────

const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
};

// ─── Mock UsersService ───────────────────────────────────────────

const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

describe('UsersController', () => {
    let controller: UsersController;
    let service: typeof mockUsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: mockUsersService }],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get(UsersService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // ═══════════════════════════════════════════════════════════════
    // POST /users — create
    // ═══════════════════════════════════════════════════════════════

    describe('create', () => {
        it('should call usersService.create and return the result', async () => {
            const dto = {
                email: 'john@example.com',
                password: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
            };
            service.create.mockResolvedValue(mockUser);

            const result = await controller.create(dto);

            expect(result).toEqual(mockUser);
            expect(service.create).toHaveBeenCalledWith(dto);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // GET /users — findAll
    // ═══════════════════════════════════════════════════════════════

    describe('findAll', () => {
        it('should return an array of users', async () => {
            service.findAll.mockResolvedValue([mockUser]);

            const result = await controller.findAll();

            expect(result).toEqual([mockUser]);
            expect(service.findAll).toHaveBeenCalled();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // GET /users/:id — findOne
    // ═══════════════════════════════════════════════════════════════

    describe('findOne', () => {
        it('should return a single user', async () => {
            service.findOne.mockResolvedValue(mockUser);

            const result = await controller.findOne(mockUser.id);

            expect(result).toEqual(mockUser);
            expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // PATCH /users/:id — update
    // ═══════════════════════════════════════════════════════════════

    describe('update', () => {
        it('should update and return the user', async () => {
            const dto = { firstName: 'Jane' };
            const updated = { ...mockUser, firstName: 'Jane' };
            service.update.mockResolvedValue(updated);

            const result = await controller.update(mockUser.id, dto);

            expect(result.firstName).toBe('Jane');
            expect(service.update).toHaveBeenCalledWith(mockUser.id, dto);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // DELETE /users/:id — remove
    // ═══════════════════════════════════════════════════════════════

    describe('remove', () => {
        it('should delete the user', async () => {
            const deleteMsg = { message: `User with ID "${mockUser.id}" has been deleted` };
            service.remove.mockResolvedValue(deleteMsg);

            const result = await controller.remove(mockUser.id);

            expect(result).toEqual(deleteMsg);
            expect(service.remove).toHaveBeenCalledWith(mockUser.id);
        });
    });
});
