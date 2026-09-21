import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new category.
     * Prevents duplicate names (case-insensitive check on `name_en`).
     */
    async create(createCategoryDto: CreateCategoryDto) {
        const existing = await this.prisma.category.findFirst({
            where: {
                name_en: {
                    equals: createCategoryDto.name_en,
                    mode: 'insensitive',
                },
            },
        });

        if (existing) {
            throw new ConflictException(
                `A category with the name "${createCategoryDto.name_en}" already exists`,
            );
        }

        return this.prisma.category.create({
            data: createCategoryDto,
        });
    }

    /**
     * Return all categories ordered by creation date (newest first).
     */
    async findAll() {
        return this.prisma.category.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Return a single category by ID.
     */
    async findOne(id: string) {
        this.validateObjectId(id);

        const category = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID "${id}" not found`);
        }

        return category;
    }

    /**
     * Update a category by ID.
     */
    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        this.validateObjectId(id);

        const existing = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`Category with ID "${id}" not found`);
        }

        // Check for name conflict if name_en is being changed
        if (
            updateCategoryDto.name_en &&
            updateCategoryDto.name_en.toLowerCase() !== existing.name_en.toLowerCase()
        ) {
            const nameTaken = await this.prisma.category.findFirst({
                where: {
                    name_en: {
                        equals: updateCategoryDto.name_en,
                        mode: 'insensitive',
                    },
                },
            });

            if (nameTaken) {
                throw new ConflictException(
                    `A category with the name "${updateCategoryDto.name_en}" already exists`,
                );
            }
        }

        return this.prisma.category.update({
            where: { id },
            data: updateCategoryDto,
        });
    }

    /**
     * Delete a category by ID.
     * Note: also consider deleting associated sub-categories if needed.
     */
    async remove(id: string) {
        this.validateObjectId(id);

        const existing = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`Category with ID "${id}" not found`);
        }

        await this.prisma.category.delete({ where: { id } });

        return { message: `Category with ID "${id}" has been deleted` };
    }

    /**
     * Bulk-import categories.
     * Skips duplicates (case-insensitive on `name_en`) both within the batch
     * and against existing records. Inserts all new categories in one DB call.
     */
    async bulkImport(items: CreateCategoryDto[]) {
        // 1. Deduplicate within the incoming batch (keep first occurrence)
        const seen = new Set<string>();
        const uniqueItems = items.filter((item) => {
            const key = item.name_en.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // 2. Fetch existing category names from DB
        const existingCategories = await this.prisma.category.findMany({
            select: { name_en: true },
        });
        const existingNames = new Set(
            existingCategories.map((c) => c.name_en.toLowerCase()),
        );

        // 3. Separate new vs. skipped
        const toCreate: CreateCategoryDto[] = [];
        const skippedNames: string[] = [];

        for (const item of uniqueItems) {
            if (existingNames.has(item.name_en.toLowerCase())) {
                skippedNames.push(item.name_en);
            } else {
                toCreate.push(item);
            }
        }

        // 4. Bulk insert
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
