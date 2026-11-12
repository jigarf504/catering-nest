
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
     * Customer IDs are allocated from a persistent sequence.
     */
    async create(createCustomerDto: CreateCustomerDto) {
        return this.prisma.customer.create({
            data: {
                ...createCustomerDto,
                customer_id: await this.nextCustomerId(),
            },
        });
    }

    private async nextCustomerId(): Promise<string> {
        const sequenceId = 'customers';

        try {
            const counter = await this.prisma.customerSequence.update({
                where: { id: sequenceId },
                data: { sequence: { increment: 1 } },
            });
            return `CUST-${String(counter.sequence).padStart(3, '0')}`;
        } catch (error: any) {
            if (error?.code !== 'P2025') throw error;
        }

        const existingCustomers = await this.prisma.customer.findMany({
            select: { customer_id: true },
        });
        const maxExistingId = existingCustomers.reduce((max, customer) => {
            const match = /^CUST-(\d+)$/i.exec(customer.customer_id);
            return match ? Math.max(max, Number(match[1])) : max;
        }, 0);

        try {
            const counter = await this.prisma.customerSequence.create({
                data: { id: sequenceId, sequence: maxExistingId + 1 },
            });
            return `CUST-${String(counter.sequence).padStart(3, '0')}`;
        } catch (error: any) {
            if (error?.code !== 'P2002') throw error;
            const counter = await this.prisma.customerSequence.update({
                where: { id: sequenceId },
                data: { sequence: { increment: 1 } },
            });
            return `CUST-${String(counter.sequence).padStart(3, '0')}`;
        }
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
     * The generated customer ID is immutable.
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

        const linkedOrder = await this.prisma.order.findFirst({
            where: { customerId: id },
            select: { id: true },
        });
        if (linkedOrder) {
            throw new ConflictException(
                'This customer has orders and cannot be deleted. Deactivate the customer instead.',
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
