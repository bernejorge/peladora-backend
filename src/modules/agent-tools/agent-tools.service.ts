/* eslint-disable  */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ClientService } from '../client/client.service';
import { OrderService } from '../order/order.service';
import { CreateOrderFromToolDto } from './dto/create-order-from-tool';
import { OrderItemDto } from '../order/dto/create-order.dto';

@Injectable()
export class AgentToolsService {

   constructor(
      private clientService : ClientService,
      private orderService : OrderService
   ){

   }

   async searchClientByName(name: string) {
      try {
         //throw new Error('Simulated error for demonstration purposes');
         const clients = await this.clientService.searchByNameSemantic(name);
         return clients;
      } catch (error) {
         console.error('Error searching client by name:', error);
         throw error;
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

   async createNewClient(name: string, address: string, phone: string) {
      return this.clientService.create({
         name,
         address,
         phone,
      });
   }
}