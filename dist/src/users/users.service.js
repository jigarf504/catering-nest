"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const USER_SELECT_FIELDS = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};
let UsersService = class UsersService {
    prisma;
    SALT_ROUNDS = 10;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, this.SALT_ROUNDS);
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
    async findOne(id) {
        this.validateObjectId(id);
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: USER_SELECT_FIELDS,
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async updateRefreshToken(userId, hashedRefreshToken) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefreshToken },
        });
    }
    async findByIdWithToken(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async update(id, updateUserDto) {
        this.validateObjectId(id);
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const emailTaken = await this.prisma.user.findUnique({
                where: { email: updateUserDto.email },
            });
            if (emailTaken) {
                throw new common_1.ConflictException('A user with this email already exists');
            }
        }
        const data = { ...updateUserDto };
        if (updateUserDto.password) {
            data.password = await bcrypt.hash(updateUserDto.password, this.SALT_ROUNDS);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: USER_SELECT_FIELDS,
        });
    }
    async remove(id) {
        this.validateObjectId(id);
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        await this.prisma.user.delete({
            where: { id },
        });
        return { message: `User with ID "${id}" has been deleted` };
    }
    validateObjectId(id) {
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;
        if (!objectIdRegex.test(id)) {
            throw new common_1.BadRequestException(`"${id}" is not a valid MongoDB ObjectId`);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map