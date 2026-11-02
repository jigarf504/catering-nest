
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new customer.
     * Prevents duplicate customer IDs.
     */
    async create(createCustomerDto: CreateCustomerDto) {
        const existing = await this.prisma.customer.findUnique({
            where: {
                customer_id: createCustomerDto.customer_id,
            },
        });

        if (existing) {
            throw new ConflictException(
                `A customer with ID "${createCustomerDto.customer_id}" already exists`,
            );
        }

        return this.prisma.customer.create({
            data: createCustomerDto,
        });
    }

    /**
     * Return all customers ordered by creation date (newest first).
     */
    async findAll() {
        return this.prisma.customer.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Return all active customers.
     */
    async findActive() {
        return this.prisma.customer.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Return a single customer by MongoDB ObjectId.
     */
    async findOne(id: string) {
        this.validateObjectId(id);

        const customer = await this.prisma.customer.findUnique({
            where: { id },
        });

        if (!customer) {
            throw new NotFoundException(
                `Customer with ID "${id}" not found`,
            );
        }

        return customer;
    }

    /**
     * Update a customer by ID.
     * Prevents duplicate customer IDs if customer_id is changed.
     */
    async update(id: string, updateCustomerDto: UpdateCustomerDto) {
        this.validateObjectId(id);

        const existing = await this.prisma.customer.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(
                `Customer with ID "${id}" not found`,
            );
        }

        // Check customer ID conflict if customer_id is being changed
        if (
            updateCustomerDto.customer_id &&
            updateCustomerDto.customer_id !== existing.customer_id
        ) {
            const customerIdTaken = await this.prisma.customer.findUnique({
                where: {
                    customer_id: updateCustomerDto.customer_id,
                },
            });

            if (customerIdTaken) {
                throw new ConflictException(
                    `A customer with ID "${updateCustomerDto.customer_id}" already exists`,
                );
            }
        }

        return this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
        });
    }

    /**
     * Delete a customer by ID.
     */
    async remove(id: string) {
        this.validateObjectId(id);

        const existing = await this.prisma.customer.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(
                `Customer with ID "${id}" not found`,
            );
        }

        await this.prisma.customer.delete({
            where: { id },
        });

        return {
            message: `Customer with ID "${id}" has been deleted`,
        };
    }

    /**
     * Validate MongoDB ObjectId (24-character hexadecimal string).
     */
    private validateObjectId(id: string): void {
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;

        if (!objectIdRegex.test(id)) {
            throw new BadRequestException(
                `"${id}" is not a valid MongoDB ObjectId`,
            );
        }
    }
}
