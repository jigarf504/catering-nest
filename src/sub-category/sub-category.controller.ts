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
    Query,
} from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/sub-categories')
export class SubCategoryController {
    constructor(private readonly subCategoryService: SubCategoryService) { }

    /**
     * POST /api/sub-categories
     * Admin-only: create a sub-category.
     */
    @Post()
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createSubCategoryDto: CreateSubCategoryDto) {
        return this.subCategoryService.create(createSubCategoryDto);
    }

    /**
     * GET /api/sub-categories
     * Any authenticated user.
     * Optional query param: ?category_id=<id> to filter by parent category.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(@Query('category_id') categoryId?: string) {
        return this.subCategoryService.findAll(categoryId);
    }

    /**
     * GET /api/sub-categories/by-category/:categoryId
     * Any authenticated user — all sub-categories under a specific category.
     */
    @Get('by-category/:categoryId')
    @HttpCode(HttpStatus.OK)
    findByCategory(@Param('categoryId') categoryId: string) {
        return this.subCategoryService.findByCategory(categoryId);
    }

    /**
     * GET /api/sub-categories/:id
     * Any authenticated user.
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string) {
        return this.subCategoryService.findOne(id);
    }

    /**
     * PATCH /api/sub-categories/:id
     * Admin-only: update a sub-category.
     */
    @Patch(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    update(
        @Param('id') id: string,
        @Body() updateSubCategoryDto: UpdateSubCategoryDto,
    ) {
        return this.subCategoryService.update(id, updateSubCategoryDto);
    }

    /**
     * DELETE /api/sub-categories/:id
     * Admin-only: delete a sub-category.
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.subCategoryService.remove(id);
    }
}
