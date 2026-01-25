/* eslint-disable */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
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

  // ✅ ahora es opcional (autogestión del cliente)
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sellerId?: number;

  @ApiPropertyOptional({ example: '2024-12-31T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiProperty({ example: 'Calle Falsa 123, Rosario' })
  @IsString()
  deliveryAddress: string;

  @ApiPropertyOptional({ example: '14:00-16:00' })
  @IsOptional()
  @IsString()
  deliveryTimeSlot?: string;

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
