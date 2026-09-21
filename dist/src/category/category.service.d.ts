import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        name_en: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        name_en: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        name_en: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        name_en: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    bulkImport(items: CreateCategoryDto[]): Promise<{
        created: number;
        skipped: number;
        skippedNames: string[];
    }>;
    private validateObjectId;
}
