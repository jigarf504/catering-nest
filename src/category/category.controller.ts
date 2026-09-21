import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { BulkImportCategoryDto } from './dto/bulk-import-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    /**
     * POST /api/categories
     * Admin-only: create a category.
     */
    @Post()
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }

    /**
     * POST /api/categories/bulk
     * Admin-only: bulk-import categories. Skips duplicates.
     */
    @Post('bulk')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    bulkImport(@Body() dto: BulkImportCategoryDto) {
        return this.categoryService.bulkImport(dto.categories);
    }

    /**
     * GET /api/categories
     * Any authenticated user.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    findAll() {
        return this.categoryService.findAll();
    }

    /**
     * GET /api/categories/:id
     * Any authenticated user.
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string) {
        return this.categoryService.findOne(id);
    }

    /**
     * PATCH /api/categories/:id
     * Admin-only: update a category.
     */
    @Patch(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoryService.update(id, updateCategoryDto);
    }

    /**
     * DELETE /api/categories/:id
     * Admin-only: delete a category.
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.categoryService.remove(id);
    }
}
