/* eslint-disable  */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from './../../../generated/prisma/client';

class OrderItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  productId: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 350 })
  @IsNumber()
  unitPrice: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  deliveryTimeSlot?: string;
  
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsOptional()
  items?: OrderItemDto[];
}
