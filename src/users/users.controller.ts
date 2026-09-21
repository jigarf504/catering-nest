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
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * POST /api/users — Admin-only: create a user directly.
     */
    @Post()
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    /**
     * GET /api/users — Admin-only: list all users.
     */
    @Get()
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    findAll() {
        return this.usersService.findAll();
    }

    /**
     * GET /api/users/:id — Any authenticated user can fetch a user by ID.
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    /**
     * PATCH /api/users/:id — Any authenticated user can update (you may add
     * ownership checks in a production app).
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    /**
     * DELETE /api/users/:id — Admin-only: delete a user.
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
