/* eslint-disable  */
import { Injectable } from '@nestjs/common';
import { ClientService } from '../client/client.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class AgentToolsService {

   constructor(
      private clientService : ClientService,
      private orderService : OrderService
   ){

   }

   async searchClientByName(name: string) {
      try {
         
         const clients = await this.clientService.searchByNameSemantic(name);
         return clients;
      } catch (error) {
         console.error('Error searching client by name:', error);
         throw error;
      }
   }

   async createNewOrderForClient(clientId: number, orderData: any) {
      
   }
}
