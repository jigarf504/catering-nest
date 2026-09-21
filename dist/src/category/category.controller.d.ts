import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { BulkImportCategoryDto } from './dto/bulk-import-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        name_en: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    bulkImport(dto: BulkImportCategoryDto): Promise<{
        created: number;
        skipped: number;
        skippedNames: string[];
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
}
