import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubCategoryDto {
    @IsMongoId()
    @IsNotEmpty()
    category_id: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name_en: string;
}
