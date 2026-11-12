import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { OrderStatus, OrderType } from '@prisma/client';

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate a unique invoice number: INV-YYYYMMDD-XXXX
     */
    private async generateInvoiceNumber(orderType: 'order' | 'quotation' = 'order'): Promise<string> {
        const now = new Date();
        const dateStr =
            now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0');

        const prefix = `${orderType === 'quotation' ? 'QUO' : 'INV'}-${dateStr}-`;

        // Find the last invoice of today to increment
        const lastOrder = await this.prisma.order.findFirst({
            where: { invoiceNumber: { startsWith: prefix } },
            orderBy: { invoiceNumber: 'desc' },
            select: { invoiceNumber: true },
        });

        let seq = 1;
        if (lastOrder) {
            const lastSeq = parseInt(lastOrder.invoiceNumber.split('-').pop() || '0', 10);
            seq = lastSeq + 1;
        }

        return `${prefix}${seq.toString().padStart(4, '0')}`;
    }

    /**
     * Calculate amounts from items and GST rates.
     */
    private calculateAmounts(
        items: { qty: number; rate: number }[],
        cgstRate: number,
        sgstRate: number,
    ) {
        const subTotal = items.reduce(
            (sum, item) => sum + parseFloat((item.qty * item.rate).toFixed(2)),
            0,
        );
        const cgstAmount = parseFloat(((subTotal * cgstRate) / 100).toFixed(2));
        const sgstAmount = parseFloat(((subTotal * sgstRate) / 100).toFixed(2));
        const totalAmount = parseFloat((subTotal + cgstAmount + sgstAmount).toFixed(2));

        return { subTotal: parseFloat(subTotal.toFixed(2)), cgstAmount, sgstAmount, totalAmount };
    }

    /**
     * Determine order status from paidAmount vs totalAmount.
     */
    private resolveStatus(paidAmount: number, totalAmount: number): OrderStatus {
        if (paidAmount >= totalAmount) return OrderStatus.PAID;
        if (paidAmount > 0) return OrderStatus.PARTIAL_PAID;
        return OrderStatus.NEW;
    }

    /**
     * Create a new order with line items.
     */
    async create(dto: CreateOrderDto) {
        const orderType = dto.order_type ?? 'order';
        const invoiceNumber = await this.generateInvoiceNumber(orderType);

        // Validate customer exists
        const customer = await this.prisma.customer.findUnique({
            where: { id: dto.customerId },
        });
        if (!customer) {
            throw new NotFoundException(`Customer with ID "${dto.customerId}" not found`);
        }

        const cgstRate = dto.cgstRate ?? 0;
        const sgstRate = dto.sgstRate ?? 0;

        const { subTotal, cgstAmount, sgstAmount, totalAmount } = this.calculateAmounts(
            dto.items,
            cgstRate,
            sgstRate,
        );

        const advanceAmount = dto.advanceAmount ?? 0;
        if (advanceAmount > totalAmount) {
            throw new BadRequestException('Advance amount cannot exceed the order total');
        }

        const order = await this.prisma.order.create({
            data: {
                invoiceNumber,
                order_type: orderType === 'quotation' ? OrderType.quotation : OrderType.order,
                order_date: dto.order_date ? new Date(dto.order_date) : undefined,
                advanceAmount,
                customerId: dto.customerId,
                customerName: dto.customerName ?? customer.name,
                mobile: dto.mobile ?? customer.mobile_number,
                mobile2: dto.mobile2 ?? customer.mobile_number_2,
                address: dto.address ?? customer.address,
                subTotal,
                cgstRate,
                sgstRate,
                cgstAmount,
                sgstAmount,
                totalAmount,
                paidAmount: 0,
                status: this.resolveStatus(advanceAmount, totalAmount),
                items: {
                    create: dto.items.map((item) => ({
                        description: item.description,
                        qty: item.qty,
                        rate: item.rate,
                        amount: parseFloat((item.qty * item.rate).toFixed(2)),
                    })),
                },
                history: {
                    create: {
                        action: 'CREATED',
                        description: `${orderType === 'quotation' ? 'Quotation' : 'Order'} ${invoiceNumber} created. Total: ₹${totalAmount}. Advance: ₹${advanceAmount}`,
                    },
                },
            },
            include: { customer: true, items: true, payments: true, history: true },
        });

        return order;
    }

    /**
     * Return all orders (newest first) with items + payments.
     */
    async findAll() {
        return this.prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: { items: true, payments: true, customer: true },
        });
    }

    /**
     * Return a single order with all relations.
     */
    async findOne(id: string) {
        this.validateObjectId(id);

        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                items: true,
                payments: { orderBy: { createdAt: 'desc' } },
                history: { orderBy: { createdAt: 'desc' } },
            },
        });

        if (!order) {
            throw new NotFoundException(`Order with ID "${id}" not found`);
        }

        return order;
    }

    /**
     * Update an order (items, customer, GST).
     * Recalculates all amounts and rechecks status.
     */
    async update(id: string, dto: UpdateOrderDto) {
        this.validateObjectId(id);

        const existing = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!existing) {
            throw new NotFoundException(`Order with ID "${id}" not found`);
        }

        // Validate customer exists if customerId is being changed
        if (dto.customerId) {
            const customer = await this.prisma.customer.findUnique({
                where: { id: dto.customerId },
            });
            if (!customer) {
                throw new NotFoundException(`Customer with ID "${dto.customerId}" not found`);
            }
        }

        const cgstRate = dto.cgstRate ?? existing.cgstRate;
        const sgstRate = dto.sgstRate ?? existing.sgstRate;

        // If items are provided, replace them
        let items = existing.items;
        if (dto.items && dto.items.length > 0) {
            // Delete old items
            await this.prisma.orderItem.deleteMany({ where: { order_id: id } });
            items = dto.items.map((item) => ({
                ...item,
                amount: parseFloat((item.qty * item.rate).toFixed(2)),
            })) as any;
        }

        const { subTotal, cgstAmount, sgstAmount, totalAmount } = this.calculateAmounts(
            dto.items && dto.items.length > 0
                ? dto.items.map((i) => ({ qty: i.qty, rate: i.rate }))
                : existing.items,
            cgstRate,
            sgstRate,
        );

        const advanceAmount = dto.advanceAmount ?? existing.advanceAmount ?? 0;
        if (advanceAmount + existing.paidAmount > totalAmount) {
            throw new BadRequestException('Advance and recorded payments cannot exceed the order total');
        }
        const status = this.resolveStatus(existing.paidAmount + advanceAmount, totalAmount);

        const changes: string[] = [];
        if (dto.customerId && dto.customerId !== existing.customerId)
            changes.push(`Customer: ${existing.customerId} → ${dto.customerId}`);
        if (dto.items) changes.push(`Items updated (${dto.items.length} items)`);
        if (dto.cgstRate !== undefined && dto.cgstRate !== existing.cgstRate)
            changes.push(`CGST: ${existing.cgstRate}% → ${dto.cgstRate}%`);
        if (dto.sgstRate !== undefined && dto.sgstRate !== existing.sgstRate)
            changes.push(`SGST: ${existing.sgstRate}% → ${dto.sgstRate}%`);
        if (dto.order_date !== undefined && dto.order_date !== existing.order_date?.toISOString().slice(0, 10))
            changes.push(`Date updated to ${dto.order_date}`);
        if (dto.advanceAmount !== undefined && dto.advanceAmount !== existing.advanceAmount)
            changes.push(`Advance: ₹${existing.advanceAmount} → ₹${dto.advanceAmount}`);
        if (totalAmount !== existing.totalAmount)
            changes.push(`Total: ₹${existing.totalAmount} → ₹${totalAmount}`);

        const updateData: any = {
            customerId: dto.customerId ?? existing.customerId,
            order_date: dto.order_date ? new Date(dto.order_date) : existing.order_date,
            advanceAmount,
            customerName: dto.customerName ?? existing.customerName,
            mobile: dto.mobile ?? existing.mobile,
            mobile2: dto.mobile2 ?? existing.mobile2,
            address: dto.address ?? existing.address,
            subTotal,
            cgstRate,
            sgstRate,
            cgstAmount,
            sgstAmount,
            totalAmount,
            status,
        };

        // Create new items if provided
        if (dto.items && dto.items.length > 0) {
            updateData.items = {
                create: dto.items.map((item) => ({
                    description: item.description,
                    qty: item.qty,
                    rate: item.rate,
                    amount: parseFloat((item.qty * item.rate).toFixed(2)),
                })),
            };
        }

        // Log history
        if (changes.length > 0) {
            updateData.history = {
                create: {
                    action: 'UPDATED',
                    description: changes.join('. '),
                },
            };
        }

        const updated = await this.prisma.order.update({
            where: { id },
            data: updateData,
            include: { customer: true, items: true, payments: true, history: true },
        });

        return updated;
    }

    /** Convert an unconfirmed quotation into an order. */
    async confirmQuotation(id: string) {
        this.validateObjectId(id);

        const existing = await this.prisma.order.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Order with ID "${id}" not found`);
        }
        if (existing.order_type !== OrderType.quotation) {
            throw new BadRequestException('Only an unconfirmed quotation can be confirmed');
        }

        return this.prisma.order.update({
            where: { id },
            data: {
                order_type: OrderType.order,
                history: {
                    create: {
                        action: 'QUOTATION_CONFIRMED',
                        description: `Quotation ${existing.invoiceNumber} confirmed as an order.`,
                    },
                },
            },
            include: { customer: true, items: true, payments: true, history: true },
        });
    }

    /**
     * Delete an order and all related data (cascade).
     */
    async remove(id: string) {
        this.validateObjectId(id);

        const existing = await this.prisma.order.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Order with ID "${id}" not found`);
        }

        // Delete related records first (MongoDB doesn't auto-cascade)
        await this.prisma.orderItem.deleteMany({ where: { order_id: id } });
        await this.prisma.payment.deleteMany({ where: { order_id: id } });
        await this.prisma.orderHistory.deleteMany({ where: { order_id: id } });
        await this.prisma.order.delete({ where: { id } });

        return { message: `Order "${existing.invoiceNumber}" has been deleted` };
    }

    /**
     * Add a payment to an order.
     * Auto-updates paidAmount and status.
     */
    async addPayment(orderId: string, dto: AddPaymentDto) {
        this.validateObjectId(orderId);

        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException(`Order with ID "${orderId}" not found`);
        }
        if (order.order_type === OrderType.quotation) {
            throw new BadRequestException('Confirm this quotation before recording a payment');
        }

        const remaining = parseFloat((order.totalAmount - order.paidAmount - (order.advanceAmount ?? 0)).toFixed(2));
        if (dto.amount > remaining) {
            throw new BadRequestException(
                `Payment amount ₹${dto.amount} exceeds remaining balance ₹${remaining}`,
            );
        }

        const newPaidAmount = parseFloat((order.paidAmount + dto.amount).toFixed(2));
        const newStatus = this.resolveStatus(newPaidAmount + (order.advanceAmount ?? 0), order.totalAmount);

        // Create payment + update order + log history in one operation
        const payment = await this.prisma.payment.create({
            data: {
                order_id: orderId,
                amount: dto.amount,
                mode: dto.mode,
                chequeNumber: dto.chequeNumber,
                chequeDate: dto.chequeDate,
                chequeBank: dto.chequeBank,
                note: dto.note,
            },
        });

        const statusChanged = newStatus !== order.status;
        const historyEntries: { action: string; description: string }[] = [
            {
                action: 'PAYMENT_ADDED',
                description: `Payment of ₹${dto.amount} received via ${dto.mode}${dto.chequeNumber ? ` (Cheque: ${dto.chequeNumber})` : ''}. Paid: ₹${newPaidAmount + (order.advanceAmount ?? 0)} / ₹${order.totalAmount}`,
            },
        ];

        if (statusChanged) {
            historyEntries.push({
                action: 'STATUS_CHANGED',
                description: `Status changed from ${order.status} to ${newStatus}`,
            });
        }

        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus,
                history: { create: historyEntries },
            },
        });

        // Return the updated order
        return this.findOne(orderId);
    }

    /**
     * Get order history.
     */
    async getHistory(orderId: string) {
        this.validateObjectId(orderId);

        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException(`Order with ID "${orderId}" not found`);
        }

        return this.prisma.orderHistory.findMany({
            where: { order_id: orderId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Validates that a string is a valid MongoDB ObjectId (24-char hex).
     */
    private validateObjectId(id: string): void {
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;
        if (!objectIdRegex.test(id)) {
            throw new BadRequestException(`"${id}" is not a valid MongoDB ObjectId`);
        }
    }
}
