import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

export class BulkImportCategoryDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateCategoryDto)
    categories: CreateCategoryDto[];
}
