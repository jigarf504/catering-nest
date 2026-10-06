import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate a unique invoice number: INV-YYYYMMDD-XXXX
     */
    private async generateInvoiceNumber(): Promise<string> {
        const now = new Date();
        const dateStr =
            now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0');

        const prefix = `INV-${dateStr}-`;

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
        const subTotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
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
        const invoiceNumber = await this.generateInvoiceNumber();
        const cgstRate = dto.cgstRate ?? 0;
        const sgstRate = dto.sgstRate ?? 0;

        const { subTotal, cgstAmount, sgstAmount, totalAmount } = this.calculateAmounts(
            dto.items,
            cgstRate,
            sgstRate,
        );

        const order = await this.prisma.order.create({
            data: {
                invoiceNumber,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                subTotal,
                cgstRate,
                sgstRate,
                cgstAmount,
                sgstAmount,
                totalAmount,
                paidAmount: 0,
                status: OrderStatus.NEW,
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
                        description: `Invoice ${invoiceNumber} created. Total: ₹${totalAmount}`,
                    },
                },
            },
            include: { items: true, payments: true, history: true },
        });

        return order;
    }

    /**
     * Return all orders (newest first) with items + payments.
     */
    async findAll() {
        return this.prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: { items: true, payments: true },
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

        const status = this.resolveStatus(existing.paidAmount, totalAmount);

        const changes: string[] = [];
        if (dto.customerName && dto.customerName !== existing.customerName)
            changes.push(`Customer: ${existing.customerName} → ${dto.customerName}`);
        if (dto.items) changes.push(`Items updated (${dto.items.length} items)`);
        if (dto.cgstRate !== undefined && dto.cgstRate !== existing.cgstRate)
            changes.push(`CGST: ${existing.cgstRate}% → ${dto.cgstRate}%`);
        if (dto.sgstRate !== undefined && dto.sgstRate !== existing.sgstRate)
            changes.push(`SGST: ${existing.sgstRate}% → ${dto.sgstRate}%`);
        if (totalAmount !== existing.totalAmount)
            changes.push(`Total: ₹${existing.totalAmount} → ₹${totalAmount}`);

        const updateData: any = {
            customerName: dto.customerName ?? existing.customerName,
            customerPhone: dto.customerPhone !== undefined ? dto.customerPhone : existing.customerPhone,
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
            include: { items: true, payments: true, history: true },
        });

        return updated;
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

        const remaining = parseFloat((order.totalAmount - order.paidAmount).toFixed(2));
        if (dto.amount > remaining) {
            throw new BadRequestException(
                `Payment amount ₹${dto.amount} exceeds remaining balance ₹${remaining}`,
            );
        }

        const newPaidAmount = parseFloat((order.paidAmount + dto.amount).toFixed(2));
        const newStatus = this.resolveStatus(newPaidAmount, order.totalAmount);

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
                description: `Payment of ₹${dto.amount} received via ${dto.mode}${dto.chequeNumber ? ` (Cheque: ${dto.chequeNumber})` : ''}. Paid: ₹${newPaidAmount} / ₹${order.totalAmount}`,
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
