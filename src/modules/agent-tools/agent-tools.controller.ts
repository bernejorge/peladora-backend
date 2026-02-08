/* eslint-disable  */
//agent-tools.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AgentToolsService } from './agent-tools.service';
import { CreateOrderFromToolDto } from './dto/create-order-from-tool';
import { FindOrdersByDateDto } from './dto/find-orders-by-date.dto';

@Controller('agent-tools')
export class AgentToolsController {
  constructor(private readonly agentToolsService: AgentToolsService) {}

  @Get('search-client')
  searchClientByName(@Query('name') name: string) {
    return this.agentToolsService.searchClientByName(name);
  }

  @Post('create-order')
  async createOrderFromTool(@Body() body: CreateOrderFromToolDto) {
    return this.agentToolsService.createNewOrderForClient(body);
  }

  @Post('create-client')
  async createClientFromTool(
    @Body('name') name: string,
    @Body('address') address: string,
    @Body('phone') phone: string,
  ) {
    return this.agentToolsService.createNewClient(name, address, phone);
  }

  @Post('modify-client')
  async modifyClientFromTool(
    @Body('clientId') clientId: number,
    @Body('name') name: string,
    @Body('address') address: string,
    @Body('phone') phone: string,
  ) {
    return this.agentToolsService.modifyClient(clientId, name, address, phone);
  }

  @Post('cancel-order') 
  async cancelOrderFromTool(@Body('orderId') orderId: number) {
    return this.agentToolsService.cancelOrder(orderId);
  }

  @Post('find-orders')
  async findOrdersForClient(@Body('clientId') clientId: number, @Body('n') n: number = 10) {
    return this.agentToolsService.findOrdersForClient(clientId, n);
  }   

  @Post('find-orders-by-date')
  async findOrdersByDateRange(@Body() body: FindOrdersByDateDto) {
    return this.agentToolsService.findOrdersByDateRange(body);
  }

}
