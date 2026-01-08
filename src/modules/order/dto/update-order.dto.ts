/* eslint-disable  */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus } from './../../../generated/prisma/client';

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
}
