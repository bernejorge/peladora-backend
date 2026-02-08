/* eslint-disable  */
//agent-tools.service.ts

import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ClientService } from '../client/client.service';
import { OrderService } from '../order/order.service';
import { CreateOrderFromToolDto } from './dto/create-order-from-tool';
import { OrderItemDto } from '../order/dto/create-order.dto';
import { UpdateClientDto } from '../client/dto/update-client.dto';
import { parseLocalDate } from '../../utils/date-time.utils';


@Injectable()
export class AgentToolsService {

   constructor(
      private clientService: ClientService,
      private orderService: OrderService
   ) {

   }

   async searchClientByName(name: string) {
      try {
         //throw new Error('Simulated error for demonstration purposes');
         const clients = await this.clientService.searchByNameSemantic(name);
         return clients;
      } catch (error) {
         console.error('Error searching client by name:', error);
         throw new HttpException('Error searching client by name', HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }

   async createNewOrderForClient(body: CreateOrderFromToolDto) {
      let items: OrderItemDto[];

      try {
         items = JSON.parse(body.itemsJson);
      } catch (err) {
         throw new BadRequestException(
            'itemsJson no es un JSON valido. Ej esperado: [{"productId":1,"quantity":2,"unitPrice":500}]',
         );
      }

      if (!Array.isArray(items)) {
         throw new BadRequestException('itemsJson debe ser un array de items');
      }

      const createOrderDto = {
         clientId: body.clientId,
         sellerId: body.sellerId,
         deliveryDate: body.deliveryDate,
         deliveryAddress: body.deliveryAddress,
         deliveryTimeSlot: body.deliveryTimeSlot,
         items,
      };

      return this.orderService.create(createOrderDto);
   }

   async findOrdersForClient(clientId: number, n: number = 10) {
      return this.orderService.findLatestForClient(clientId, n);
   }


   async cancelOrder(orderId: number) {
      return this.orderService.cancel(orderId);
   }

   async createNewClient(name: string, address: string, phone: string) {
      return this.clientService.create({
         name,
         address,
         phone,
      });
   }

   async modifyClient(clientId: number, name: string, address: string, phone: string) {
      const data: UpdateClientDto = {};

      if (name) data.name = name;
      if (address) data.address = address;
      if (phone) data.phone = phone;

      return this.clientService.update(clientId, data);
   }

   async findOrdersByDateRange(params: {
      from: string; // "YYYY-MM-DD"
      to: string;   // "YYYY-MM-DD"
      clientId?: number;
      sellerId?: number;
      statuses?: string[];
      orderBy?: any; // opcional, si querés permitir override
   }) {
      const { from, to, clientId, sellerId, statuses, orderBy } = params;

      if (!from || !to) {
         throw new BadRequestException('Debés enviar "from" y "to" con formato YYYY-MM-DD.');
      }

      const fromDate = parseLocalDate(from);
      const toDate = parseLocalDate(to);

      if (!fromDate) throw new BadRequestException('Formato inválido en "from". Usá YYYY-MM-DD.');
      if (!toDate) throw new BadRequestException('Formato inválido en "to". Usá YYYY-MM-DD.');

      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      if (start.getTime() > end.getTime()) {
         throw new BadRequestException('"from" debe ser menor o igual a "to".');
      }

      const where: any = {
         deliveryDate: { gte: start, lte: end },
      };

      if (clientId !== undefined && clientId !== null) where.clientId = clientId;
      if (sellerId !== undefined && sellerId !== null) where.sellerId = sellerId;

      if (Array.isArray(statuses) && statuses.length > 0) {
         where.status = { in: statuses };
      }

      const finalOrderBy = orderBy ?? { deliveryDate: 'desc' };

      return this.orderService.findAll({
         where,
         orderBy: finalOrderBy,
      });
   }


}