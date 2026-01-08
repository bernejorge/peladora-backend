/* eslint-disable  */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  clientId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  sellerId: number;

  @ApiProperty({ example: 'Calle Falsa 123, Rosario' })
  deliveryAddress: string;

  @ApiPropertyOptional({ example: '14:00-16:00' })
  deliveryTimeSlot?: string;

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
