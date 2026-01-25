import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOrderFromToolDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  clientId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  sellerId: number;

  @ApiPropertyOptional({ example: '2024-12-31T14:00:00Z' })
  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @ApiProperty({ example: 'Calle Falsa 123, Rosario' })
  @IsString()
  deliveryAddress: string;

  @ApiPropertyOptional({ example: '14:00-16:00' })
  @IsOptional()
  @IsString()
  deliveryTimeSlot?: string;

  @ApiProperty({
    example: '[{"productId":1,"quantity":3,"unitPrice":500}]',
  })
  @IsString()
  itemsJson: string;
}
