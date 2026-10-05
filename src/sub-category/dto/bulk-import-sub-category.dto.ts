import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateSubCategoryDto } from './create-sub-category.dto';

export class BulkImportSubCategoryDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateSubCategoryDto)
    subCategories: CreateSubCategoryDto[];
}
