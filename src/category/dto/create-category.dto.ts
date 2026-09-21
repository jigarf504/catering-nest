import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name_en: string;
}
