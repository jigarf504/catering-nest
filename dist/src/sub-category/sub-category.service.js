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
exports.SubCategoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubCategoryService = class SubCategoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSubCategoryDto) {
        const { category_id, name_en } = createSubCategoryDto;
        const parentCategory = await this.prisma.category.findUnique({
            where: { id: category_id },
        });
        if (!parentCategory) {
            throw new common_1.NotFoundException(`Category with ID "${category_id}" not found`);
        }
        const existing = await this.prisma.subCategory.findFirst({
            where: {
                category_id,
                name_en: { equals: name_en, mode: 'insensitive' },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`A sub-category with the name "${name_en}" already exists in this category`);
        }
        return this.prisma.subCategory.create({
            data: createSubCategoryDto,
        });
    }
    async findAll(categoryId) {
        return this.prisma.subCategory.findMany({
            where: categoryId ? { category_id: categoryId } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        this.validateObjectId(id);
        const subCategory = await this.prisma.subCategory.findUnique({
            where: { id },
        });
        if (!subCategory) {
            throw new common_1.NotFoundException(`Sub-category with ID "${id}" not found`);
        }
        return subCategory;
    }
    async findByCategory(categoryId) {
        this.validateObjectId(categoryId);
        const parentCategory = await this.prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!parentCategory) {
            throw new common_1.NotFoundException(`Category with ID "${categoryId}" not found`);
        }
        return this.prisma.subCategory.findMany({
            where: { category_id: categoryId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async update(id, updateSubCategoryDto) {
        this.validateObjectId(id);
        const existing = await this.prisma.subCategory.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Sub-category with ID "${id}" not found`);
        }
        const targetCategoryId = updateSubCategoryDto.category_id ?? existing.category_id;
        if (updateSubCategoryDto.category_id &&
            updateSubCategoryDto.category_id !== existing.category_id) {
            const parentCategory = await this.prisma.category.findUnique({
                where: { id: updateSubCategoryDto.category_id },
            });
            if (!parentCategory) {
                throw new common_1.NotFoundException(`Category with ID "${updateSubCategoryDto.category_id}" not found`);
            }
        }
        if (updateSubCategoryDto.name_en) {
            const nameTaken = await this.prisma.subCategory.findFirst({
                where: {
                    category_id: targetCategoryId,
                    name_en: {
                        equals: updateSubCategoryDto.name_en,
                        mode: 'insensitive',
                    },
                    NOT: { id },
                },
            });
            if (nameTaken) {
                throw new common_1.ConflictException(`A sub-category with the name "${updateSubCategoryDto.name_en}" already exists in this category`);
            }
        }
        return this.prisma.subCategory.update({
            where: { id },
            data: updateSubCategoryDto,
        });
    }
    async remove(id) {
        this.validateObjectId(id);
        const existing = await this.prisma.subCategory.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Sub-category with ID "${id}" not found`);
        }
        await this.prisma.subCategory.delete({ where: { id } });
        return { message: `Sub-category with ID "${id}" has been deleted` };
    }
    validateObjectId(id) {
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;
        if (!objectIdRegex.test(id)) {
            throw new common_1.BadRequestException(`"${id}" is not a valid MongoDB ObjectId`);
        }
    }
};
exports.SubCategoryService = SubCategoryService;
exports.SubCategoryService = SubCategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubCategoryService);
//# sourceMappingURL=sub-category.service.js.map