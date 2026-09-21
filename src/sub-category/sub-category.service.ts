import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';

@Injectable()
export class SubCategoryService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a sub-category.
     * Validates that the parent category exists and that
     * name_en is unique within the same category.
     */
    async create(createSubCategoryDto: CreateSubCategoryDto) {
        const { category_id, name_en } = createSubCategoryDto;

        // Ensure parent category exists
        const parentCategory = await this.prisma.category.findUnique({
            where: { id: category_id },
        });

        if (!parentCategory) {
            throw new NotFoundException(
                `Category with ID "${category_id}" not found`,
            );
        }

        // Check for duplicate name_en within the same category
        const existing = await this.prisma.subCategory.findFirst({
            where: {
                category_id,
                name_en: { equals: name_en, mode: 'insensitive' },
            },
        });

        if (existing) {
            throw new ConflictException(
                `A sub-category with the name "${name_en}" already exists in this category`,
            );
        }

        return this.prisma.subCategory.create({
            data: createSubCategoryDto,
        });
    }

    /**
     * Return all sub-categories, optionally filtered by category_id.
     */
    async findAll(categoryId?: string) {
        return this.prisma.subCategory.findMany({
            where: categoryId ? { category_id: categoryId } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Return a single sub-category by ID.
     */
    async findOne(id: string) {
        this.validateObjectId(id);

        const subCategory = await this.prisma.subCategory.findUnique({
            where: { id },
        });

        if (!subCategory) {
            throw new NotFoundException(`Sub-category with ID "${id}" not found`);
        }

        return subCategory;
    }

    /**
     * Return all sub-categories that belong to a given category.
     */
    async findByCategory(categoryId: string) {
        this.validateObjectId(categoryId);

        const parentCategory = await this.prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!parentCategory) {
            throw new NotFoundException(
                `Category with ID "${categoryId}" not found`,
            );
        }

        return this.prisma.subCategory.findMany({
            where: { category_id: categoryId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Update a sub-category by ID.
     */
    async update(id: string, updateSubCategoryDto: UpdateSubCategoryDto) {
        this.validateObjectId(id);

        const existing = await this.prisma.subCategory.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`Sub-category with ID "${id}" not found`);
        }

        const targetCategoryId = updateSubCategoryDto.category_id ?? existing.category_id;

        // If category_id is being changed, ensure the new parent exists
        if (
            updateSubCategoryDto.category_id &&
            updateSubCategoryDto.category_id !== existing.category_id
        ) {
            const parentCategory = await this.prisma.category.findUnique({
                where: { id: updateSubCategoryDto.category_id },
            });

            if (!parentCategory) {
                throw new NotFoundException(
                    `Category with ID "${updateSubCategoryDto.category_id}" not found`,
                );
            }
        }

        // Check for name conflict within the target category
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
                throw new ConflictException(
                    `A sub-category with the name "${updateSubCategoryDto.name_en}" already exists in this category`,
                );
            }
        }

        return this.prisma.subCategory.update({
            where: { id },
            data: updateSubCategoryDto,
        });
    }

    /**
     * Delete a sub-category by ID.
     */
    async remove(id: string) {
        this.validateObjectId(id);

        const existing = await this.prisma.subCategory.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`Sub-category with ID "${id}" not found`);
        }

        await this.prisma.subCategory.delete({ where: { id } });

        return { message: `Sub-category with ID "${id}" has been deleted` };
    }

    /**
     * Validates that a string is a valid MongoDB ObjectId (24-char hex).
     */
    private validateObjectId(id: string): void {
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;
        if (!objectIdRegex.test(id)) {
            throw new BadRequestException(`"${id}" is not a valid MongoDB ObjectId`);
        }
    }
}
