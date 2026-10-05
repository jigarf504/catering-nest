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
     * Bulk-import sub-categories under a single parent category.
     * Skips duplicates (case-insensitive on `name_en`) both within the batch
     * and against existing records in the same category.
     */
    async bulkImport(items: { category_id: string; name: string; name_en: string }[]) {
        if (items.length === 0) {
            throw new BadRequestException('Items array must not be empty');
        }

        // All items must share the same category_id
        const categoryId = items[0].category_id;

        // Validate parent category exists
        this.validateObjectId(categoryId);
        const parentCategory = await this.prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!parentCategory) {
            throw new NotFoundException(
                `Category with ID "${categoryId}" not found`,
            );
        }

        // 1. Deduplicate within the incoming batch (keep first occurrence)
        const seen = new Set<string>();
        const uniqueItems = items.filter((item) => {
            const key = item.name_en.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // 2. Fetch existing sub-category names in this category
        const existingSubCategories = await this.prisma.subCategory.findMany({
            where: { category_id: categoryId },
            select: { name_en: true },
        });
        const existingNames = new Set(
            existingSubCategories.map((sc) => sc.name_en.toLowerCase()),
        );

        // 3. Separate new vs. skipped
        const toCreate: { category_id: string; name: string; name_en: string }[] = [];
        const skippedNames: string[] = [];

        for (const item of uniqueItems) {
            if (existingNames.has(item.name_en.toLowerCase())) {
                skippedNames.push(item.name_en);
            } else {
                toCreate.push({
                    category_id: categoryId,
                    name: item.name,
                    name_en: item.name_en,
                });
            }
        }

        // 4. Bulk insert
        if (toCreate.length > 0) {
            await this.prisma.subCategory.createMany({
                data: toCreate,
            });
        }

        return {
            created: toCreate.length,
            skipped: skippedNames.length,
            skippedNames,
        };
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
