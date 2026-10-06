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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    /**
     * POST /api/orders
     * Admin-only: create a new order/invoice.
     */
    @Post()
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateOrderDto) {
        return this.orderService.create(dto);
    }

    /**
     * GET /api/orders
     * Any authenticated user: list all orders.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    findAll() {
        return this.orderService.findAll();
    }

    /**
     * GET /api/orders/:id
     * Any authenticated user: get a single order with all details.
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string) {
        return this.orderService.findOne(id);
    }

    /**
     * PATCH /api/orders/:id
     * Admin-only: update order details.
     */
    @Patch(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
        return this.orderService.update(id, dto);
    }

    /**
     * DELETE /api/orders/:id
     * Admin-only: delete an order.
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.orderService.remove(id);
    }

    /**
     * POST /api/orders/:id/payments
     * Admin-only: add a payment to an order.
     */
    @Post(':id/payments')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    addPayment(@Param('id') id: string, @Body() dto: AddPaymentDto) {
        return this.orderService.addPayment(id, dto);
    }

    /**
     * GET /api/orders/:id/history
     * Any authenticated user: get order history.
     */
    @Get(':id/history')
    @HttpCode(HttpStatus.OK)
    getHistory(@Param('id') id: string) {
        return this.orderService.getHistory(id);
    }
}
