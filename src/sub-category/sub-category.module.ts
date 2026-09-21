import { Module } from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import { SubCategoryController } from './sub-category.controller';

@Module({
    controllers: [SubCategoryController],
    providers: [SubCategoryService],
    exports: [SubCategoryService],
})
export class SubCategoryModule { }
