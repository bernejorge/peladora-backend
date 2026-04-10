/* eslint-disable */
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from 'src/database/prisma.service';
import { AccountMovementType, PaymentStatus, Prisma } from 'src/generated/prisma/browser';
import { PaymentMethod } from 'src/generated/prisma/enums';


@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

   async recordPayment(params: {
      clientId: number;
      amount: Decimal | string | number;
      method?: PaymentMethod;
      date?: Date;
      reference?: string;
      note?: string;
      allocations?: Array<{
         orderId: number;
         amountApplied: Decimal | string | number;
      }>;
   }) {
      const {
         clientId,
         amount,
         method = PaymentMethod.TRANSFER,
         date = new Date(),
         reference,
         note,
         allocations = [],
      } = params;

      const paymentAmount = new Prisma.Decimal(amount);
      if (paymentAmount.lte(0)) {
         throw new BadRequestException('El monto del pago debe ser mayor a 0.');
      }

      const allocationsTotal = allocations.reduce(
         (sum, a) => sum.plus(new Prisma.Decimal(a.amountApplied)),
         new Prisma.Decimal(0),
      );

      if (allocationsTotal.gt(paymentAmount)) {
         throw new BadRequestException(
            'La suma de imputaciones no puede superar el monto del pago.',
         );
      }

      return this.prisma.$transaction(async (tx) => {
         const account = await tx.account.upsert({
            where: { clientId },
            update: {},
            create: {
               clientId,
               balance: new Prisma.Decimal(0),
               version: 0,
            },
            select: { id: true },
         });

         for (const a of allocations) {
            const applied = new Prisma.Decimal(a.amountApplied);
            if (applied.lte(0)) {
               throw new BadRequestException(
                  `La imputación para orden ${a.orderId} debe ser mayor a 0.`,
               );
            }

            const order = await tx.order.findUnique({
               where: { id: a.orderId },
               select: { id: true, clientId: true },
            });

            if (!order) {
               throw new NotFoundException(`Orden ${a.orderId} no encontrada.`);
            }

            if (order.clientId !== clientId) {
               throw new BadRequestException(
                  `La orden ${a.orderId} no pertenece al cliente ${clientId}.`,
               );
            }
         }

         const payment = await tx.payment.create({
            data: {
               clientId,
               accountId: account.id,
               amount: paymentAmount,
               method,
               date,
               reference,
               note,
               allocations:
                  allocations.length > 0
                     ? {
                           create: allocations.map((a) => ({
                              orderId: a.orderId,
                              amountApplied: new Prisma.Decimal(a.amountApplied),
                           })),
                        }
                     : undefined,
            },
            include: { allocations: true },
         });

         const movementAmount = paymentAmount.negated();
         await tx.accountMovement.create({
            data: {
               accountId: account.id,
               clientId,
               type: AccountMovementType.CREDIT_PAYMENT,
               amount: movementAmount,
               paymentId: payment.id,
               date,
               note: note ?? `Pago registrado #${payment.id}`,
               externalRef: reference,
            },
         });

         await tx.account.update({
            where: { id: account.id },
            data: {
               balance: { increment: movementAmount },
               version: { increment: 1 },
            },
         });

         for (const alloc of payment.allocations) {
            await this.recalculateOrderPaymentStatus(tx, alloc.orderId);
         }

         const updatedAccount = await tx.account.findUnique({
            where: { id: account.id },
            select: { id: true, balance: true },
         });

         return {
            payment,
            account: updatedAccount,
         };
      });
   }

  /**
   * Se llama una vez que la orden está creada y su total está definido.
   * Registra deuda en cuenta corriente:
   * - crea Account si no existe
   * - crea movimiento DEBIT_ORDER (+total)
   * - actualiza balance
   * - (opcional) enlaza order.accountId si tu Order lo tiene
   */
  async onOrderCreated(params: {
    orderId: number;
    clientId: number;
    orderTotal: Decimal | string | number;
    date?: Date;
    note?: string;
  }){
      const { orderId, clientId, orderTotal, date = new Date(), note } = params;

      const amount = new Prisma.Decimal(orderTotal);
      if(amount.lte(0)){
         throw new HttpException("El monto de la orden debe ser mayor a 0.", HttpStatus.UNPROCESSABLE_ENTITY)
      }

      return this.prisma.$transaction(async (tx) => {
         // Buscar o crear account
         const account = await  tx.account.upsert({
            where: {clientId: clientId},
            update:{},
            select:{id: true},
            create:{
               clientId,
               balance: new Prisma.Decimal(0),
               version: 0,
            }
         });

         // Crear el moviento DEBIT_ORDER
         const movement = await tx.accountMovement.create({
            data:{
               accountId: account.id,
               clientId,
               type: 'DEBIT_ORDER',
               amount: amount, //positivo es deuda
               orderId,
               date: date ?? new Date(),
               note: note ?? `Deuda generada por la orden # ${orderId}`
            }
         });

         // Actualizar el balance
          await tx.account.update({
            data: {
                balance: { increment: amount},
                version: {increment: 1},
            },
            where: { id: account.id}
          });

      })

  }

  /**
   * Cancela una orden y revierte su impacto en cuenta corriente.
   * - Busca el movimiento DEBIT_ORDER original por orderId
   * - Si ya fue revertido, no hace nada (idempotente)
   * - Crea un movimiento REVERSAL con amount = -debit.amount
   * - Actualiza Account.balance en el mismo delta
   * - Marca Order.status = CANCELED (opcional acá o en OrdersService)
   */
  async onOrderCancelled(params: {
    orderId: number;
    date?: Date;
    note?: string;
  }){

   const {orderId, date, note} = params;

   return this.prisma.$transaction(async(tx) => {
      // recuperar el movimiento de deuda creado al crear la orden
      const movement = await tx.accountMovement.findFirst({
         where: {
            orderId: orderId,
            type: AccountMovementType.DEBIT_ORDER
         },
         select:{
            id: true,
            accountId: true,
            amount: true,
            clientId: true,
         },
         orderBy: { id: 'desc'}
      });

      // Si nunca se debitó (ej: orden quedó en DRAFT y no impactó cuenta),
      // no hay nada que revertir.
      if (!movement) {
        return { reversed: false, reason: 'No DEBIT_ORDER movement found for this order' };
      }

      //checkear si no existe un reversal que apunta al mismo debit
      const existingReversal = await tx.accountMovement.findFirst({
         where: {
            orderId: orderId,
            type: AccountMovementType.REVERSAL
         },
         select: {id: true}
      });

      if(existingReversal){
         return { reversed: false, reason: 'Already reversed', reversalId: existingReversal.id };
      }

      // crear el moviemiento de reversal
      const reversalAmount = movement.amount.negated(); // el reversal es negativo del debit original
      const reversal = await tx.accountMovement.create({
         data:{
            accountId: movement.accountId,
            clientId: movement.clientId,
            type: AccountMovementType.REVERSAL,
            amount: reversalAmount,
            orderId: orderId,
            reversedMovementId: movement.id,
            note: note ?? `Reversion de deuda por orden # ${orderId}`
         },
         select: { id: true },
      });

      //Actualizar el balance
      await tx.account.update({
         where: {id: movement.accountId},
         data:{ 
            balance: { increment: reversalAmount },
            version: { increment: 1 },
         }
      });

      return {
         reversed: true,
         reversalId: reversal.id,
         delta: reversalAmount.toString(),
         accountId: movement.accountId
      }

   });

  }

   private async recalculateOrderPaymentStatus(
      tx: Prisma.TransactionClient,
      orderId: number,
   ) {
      const order = await tx.order.findUnique({
         where: { id: orderId },
         select: { id: true, total: true },
      });

      if (!order) {
         throw new NotFoundException(`Orden ${orderId} no encontrada.`);
      }

      const applied = await tx.paymentAllocation.aggregate({
         where: { orderId },
         _sum: { amountApplied: true },
      });

      const paid = applied._sum.amountApplied ?? new Prisma.Decimal(0);

      let nextStatus: (typeof PaymentStatus)[keyof typeof PaymentStatus] =
         PaymentStatus.UNPAID;
      if (paid.gt(0) && paid.lt(order.total)) {
         nextStatus = PaymentStatus.PARTIALLY_PAID;
      }
      if (paid.gte(order.total) && order.total.gt(0)) {
         nextStatus = PaymentStatus.PAID;
      }

      await tx.order.update({
         where: { id: orderId },
         data: { paymentStatus: nextStatus },
      });
   }

}
