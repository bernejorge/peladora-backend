/* eslint-disable  */
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AgentToolsService } from './agent-tools.service';
import { CreateOrderFromToolDto } from './dto/create-order-from-tool';

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
}
