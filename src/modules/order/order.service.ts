/* eslint-disable */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from 'src/generated/prisma/enums';
import { parseLocalDate } from '../../utils/date-time.utils';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderDto) {
    // deliveryDate ahora es DATE en DB, así que lo tratamos como "YYYY-MM-DD"
    // - Si viene, lo parseamos como fecha local (sin UTC)
    // - Si no viene, lo omitimos para que Postgres use CURRENT_DATE
    let deliveryDate: Date | undefined = undefined;

    if (data.deliveryDate) {
      // soporta que te manden "YYYY-MM-DD" o Date
      if (typeof data.deliveryDate === 'string') {
        const parsed = parseLocalDate(data.deliveryDate);
        if (!parsed) {
          throw new BadRequestException(
            'deliveryDate inválida. Usá formato YYYY-MM-DD.',
          );
        }
        deliveryDate = parsed;
      } else if ((data.deliveryDate as any) instanceof Date) {
        // si llega Date, lo normalizamos a date-only local
        deliveryDate = toLocalDateOnly(data.deliveryDate);
      }
    }

    // 1) Calcular totales de ítems
    const itemsData = data.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const total = itemsData.reduce((sum, i) => sum + i.lineTotal, 0);

    // 2) Crear la orden
    const order = await this.prisma.order.create({
      data: {
        clientId: data.clientId,
        sellerId: data.sellerId,
        deliveryAddress: data.deliveryAddress,
        deliveryTimeSlot: data.deliveryTimeSlot,
        ...(deliveryDate ? { deliveryDate } : {}), // si no viene, DB pone CURRENT_DATE
        total,
        items: { create: itemsData },
      },
      include: { items: true },
    });

    return order;
  }

  async findAll(filters?: any) {
    return this.prisma.order.findMany({
      where: filters?.where || {},
      include: {
        client: true,
        seller: true,
        items: { include: { product: true } },
      },
      orderBy: filters?.orderBy || { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        seller: true,
        items: { include: { product: true } },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async update(id: number, data: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const { items = [], ...orderData } = data;

    // Si viene deliveryDate como string, lo normalizamos a Date date-only
    if ((orderData as any).deliveryDate && typeof (orderData as any).deliveryDate === 'string') {
      const parsed = parseLocalDate((orderData as any).deliveryDate);
      if (!parsed) throw new BadRequestException('deliveryDate inválida. Usá YYYY-MM-DD.');
      (orderData as any).deliveryDate = parsed;
    }

    const itemsData = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const total = itemsData.reduce((sum, item) => sum + item.lineTotal, 0);

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(orderData).length > 0) {
        await tx.order.update({
          where: { id },
          data: orderData,
        });
      }

      await tx.orderItem.deleteMany({ where: { orderId: id } });

      if (itemsData.length > 0) {
        await tx.orderItem.createMany({
          data: itemsData.map((item) => ({ ...item, orderId: id })),
        });
      }

      return tx.order.update({
        where: { id },
        data: { total },
        include: {
          client: true,
          seller: true,
          items: { include: { product: true } },
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }

  async cancel(id: number) {
    await this.findOne(id);
    return this.update(id, { status: OrderStatus.CANCELED } as any);
  }

  async findLatestForClient(clientId: number, n: number = 10) {
    const take = Number.isFinite(n) ? Math.max(1, Math.min(100, Math.floor(n))) : 10;

    return this.prisma.order.findMany({
      where: { clientId },
      take,
      orderBy: { deliveryDate: 'desc' }, // ahora es DATE, ok
      include: {
        client: true,
        seller: true,
        items: { include: { product: true } },
      },
    });
  }

  async findOrdersForToday() {
    // Como deliveryDate es DATE, buscamos [hoy, hoy]
    const today = todayLocalDateOnly();

    return this.prisma.order.findMany({
      where: {
        deliveryDate: { gte: today, lte: today },
        status: { in: ['DRAFT', 'PROCESSING'] },
      },
      include: { items: true, client: true, seller: true },
    });
  }
}

/** Devuelve "hoy" como Date local sin hora */
function todayLocalDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Normaliza un Date cualquiera a fecha local sin hora */
function toLocalDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
