/* eslint-disable */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from 'src/database/prisma.service';
import { AccountMovementType, Prisma } from 'src/generated/prisma/browser';


@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

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

}
