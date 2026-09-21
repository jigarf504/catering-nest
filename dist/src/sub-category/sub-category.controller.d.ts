import { SubCategoryService } from './sub-category.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
export declare class SubCategoryController {
    private readonly subCategoryService;
    constructor(subCategoryService: SubCategoryService);
    create(createSubCategoryDto: CreateSubCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        name_en: string;
        category_id: string;
    }>;
    findAll(categoryId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        name_en: string;
        category_id: string;
    }[]>;
    findByCategory(categoryId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        name_en: string;
        category_id: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        name_en: string;
        category_id: string;
    }>;
    update(id: string, updateSubCategoryDto: UpdateSubCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        name_en: string;
        category_id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
