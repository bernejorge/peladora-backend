/* eslint-disable  */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { AgentToolsService } from './agent-tools.service';
import { OrderService } from '../order/order.service';
import { CreateOrderFromToolDto } from './dto/create-order-from-tool';
import { OrderItemDto } from '../order/dto/create-order.dto';

@Controller('agent-tools')
export class AgentToolsController {
  constructor(
    private readonly agentToolsService: AgentToolsService,
    private readonly ordersService: OrderService,
  ) {}

  @Get('search-client')
  searchClientByName(@Query('name') name: string) {
    return this.agentToolsService.searchClientByName(name);
  }

  @Post('create-order')
  async createOrderFromTool(@Body() body: CreateOrderFromToolDto) {
    let items: OrderItemDto[];

    // 1) Convertimos el string a JSON real
    try {
      items = JSON.parse(body.itemsJson);
    } catch (err) {
      throw new BadRequestException(
        `itemsJson no es un JSON válido. Ej esperado: [{"productId":1,"quantity":2,"unitPrice":500}]`,
      );
    }

    // 2) Validación mínima (porque Flowise manda string y puede venir cualquier cosa)
    if (!Array.isArray(items)) {
      throw new BadRequestException(`itemsJson debe ser un array de items`);
    }

    // 3) Armamos el DTO real que espera tu OrdersService
    const createOrderDto = {
      clientId: body.clientId,
      sellerId: body.sellerId,
      deliveryDate: body.deliveryDate,
      deliveryAddress: body.deliveryAddress,
      deliveryTimeSlot: body.deliveryTimeSlot,
      items,
    };

    // 4) Creamos la orden usando tu servicio real
    return this.ordersService.create(createOrderDto);
  }
}
