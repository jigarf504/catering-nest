"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoryService = class CategoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCategoryDto) {
        const existing = await this.prisma.category.findFirst({
            where: {
                name_en: {
                    equals: createCategoryDto.name_en,
                    mode: 'insensitive',
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`A category with the name "${createCategoryDto.name_en}" already exists`);
        }
        return this.prisma.category.create({
            data: createCategoryDto,
        });
    }
    async findAll() {
        return this.prisma.category.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        this.validateObjectId(id);
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID "${id}" not found`);
        }
        return category;
    }
    async update(id, updateCategoryDto) {
        this.validateObjectId(id);
        const existing = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Category with ID "${id}" not found`);
        }
        if (updateCategoryDto.name_en &&
            updateCategoryDto.name_en.toLowerCase() !== existing.name_en.toLowerCase()) {
            const nameTaken = await this.prisma.category.findFirst({
                where: {
                    name_en: {
                        equals: updateCategoryDto.name_en,
                        mode: 'insensitive',
                    },
                },
            });
            if (nameTaken) {
                throw new common_1.ConflictException(`A category with the name "${updateCategoryDto.name_en}" already exists`);
            }
        }
        return this.prisma.category.update({
            where: { id },
            data: updateCategoryDto,
        });
    }
    async remove(id) {
        this.validateObjectId(id);
        const existing = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Category with ID "${id}" not found`);
        }
        await this.prisma.category.delete({ where: { id } });
        return { message: `Category with ID "${id}" has been deleted` };
    }
    async bulkImport(items) {
        const seen = new Set();
        const uniqueItems = items.filter((item) => {
            const key = item.name_en.toLowerCase();
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
        const existingCategories = await this.prisma.category.findMany({
            select: { name_en: true },
        });
        const existingNames = new Set(existingCategories.map((c) => c.name_en.toLowerCase()));
        const toCreate = [];
        const skippedNames = [];
        for (const item of uniqueItems) {
            if (existingNames.has(item.name_en.toLowerCase())) {
                skippedNames.push(item.name_en);
            }
            else {
                toCreate.push(item);
            }
        }
        if (toCreate.length > 0) {
            await this.prisma.category.createMany({
                data: toCreate,
            });
        }
        return {
            created: toCreate.length,
            skipped: skippedNames.length,
            skippedNames,
        };
    }
    validateObjectId(id) {
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;
        if (!objectIdRegex.test(id)) {
            throw new common_1.BadRequestException(`"${id}" is not a valid MongoDB ObjectId`);
        }
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoryService);
//# sourceMappingURL=category.service.js.map