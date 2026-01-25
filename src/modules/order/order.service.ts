/* eslint-disable  */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateOrderDto) {

    // Calculá fecha de entrega si no viene por body
    const deliveryDate = data.deliveryDate
      ? new Date(data.deliveryDate)
      : getDefaultDeliveryDate();


    // 1) Calcular totales de ítems
    const itemsData = data.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const total = itemsData.reduce((sum, i) => sum + i.lineTotal, 0);

    // 2) Crear la orden con ítems en una transacción
    const order = await this.prisma.order.create({
      data: {
        clientId: data.clientId,
        sellerId: data.sellerId,
        deliveryAddress: data.deliveryAddress,
        deliveryTimeSlot: data.deliveryTimeSlot,
        deliveryDate: deliveryDate,
        total: total,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return order;
  }

  findAll() {
    return this.prisma.order.findMany({
      include: {
        client: true,
        seller: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        seller: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async update(id: number, data: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const { items = [], ...orderData } = data;

    // convertimos los items del DTO al formato que guardamos en la tabla orderItem
    // y calculamos el total de línea (quantity * unitPrice)
    const itemsData = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const total = itemsData.reduce((sum, item) => sum + item.lineTotal, 0);

    return this.prisma.$transaction(async (tx) => {
      // Si no hay campos en orderData, evitamos hacer un update innecesario.
      if (Object.keys(orderData).length > 0) {
        await tx.order.update({
          where: { id },
          data: orderData,
        });
      }

      // Borramos TODOS los items actuales de la orden
      await tx.orderItem.deleteMany({ where: { orderId: id } });

      if (itemsData.length > 0) {
        // Si hay items, insertarlos desde cero con createMany.
        // Esto simplifica mucho el update (no hacemos diff item por item).
        await tx.orderItem.createMany({
          data: itemsData.map((item) => ({
            ...item,
            orderId: id,
          })),
        });
      }

      return tx.order.update({
        where: { id },
        data: { total },
        include: {
          client: true,
          seller: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Opcional: borrar los items automáticamente por cascada si lo tenés configurado
    return this.prisma.order.delete({ where: { id } });
  }

  async findOrdersForToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['DRAFT', 'PROCESSING'],
        },
      },
      include: {
        items: true,
        client: true,
        seller: true,
      }
    });
  }


}

function getDefaultDeliveryDate(): Date {
  const now = new Date();

  // Hora límite para delivery hoy
  const LIMITE_HOY = 19; // 19:00

  // Si el horario actual es antes de las 19, entregamos hoy; si no, day+1
  if (now.getHours() < LIMITE_HOY) {
    return now;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  // opcional: podés cero-hora si querés solo fecha
  tomorrow.setHours(0, 0, 0, 0);

  return tomorrow;
}
