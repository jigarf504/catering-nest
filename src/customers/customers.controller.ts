import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
} from '@nestjs/common';

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
    constructor(
        private readonly customersService: CustomersService,
    ) { }

    // POST /customers
    @Post()
    create(@Body() createCustomerDto: CreateCustomerDto) {
        return this.customersService.create(createCustomerDto);
    }

    // GET /customers
    @Get()
    findAll() {
        return this.customersService.findAll();
    }

    // GET /customers/active
    @Get('active')
    findActive() {
        return this.customersService.findActive();
    }

    // GET /customers/:id
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    // PATCH /customers/:id
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCustomerDto: UpdateCustomerDto,
    ) {
        return this.customersService.update(
            id,
            updateCustomerDto,
        );
    }

    // DELETE /customers/:id
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.customersService.remove(id);
    }
}