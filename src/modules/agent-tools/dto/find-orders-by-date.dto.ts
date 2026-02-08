/* eslint-disable  */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class FindOrdersByDateDto {
  @ApiProperty({
    description: 'Fecha desde (YYYY-MM-DD)',
    example: '2026-02-01',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from debe tener formato YYYY-MM-DD' })
  from: string;

  @ApiProperty({
    description: 'Fecha hasta (YYYY-MM-DD). Si querés un solo día: from = to',
    example: '2026-02-04',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to debe tener formato YYYY-MM-DD' })
  to: string;

  @ApiPropertyOptional({ description: 'Filtrar por cliente', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por vendedor', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sellerId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estados (ej: ["DRAFT","PROCESSING"])',
    example: ['DRAFT', 'PROCESSING'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statuses?: string[];

  @ApiPropertyOptional({
    description:
      'OrderBy de Prisma (ej: {"deliveryDate":"desc"} o {"date":"desc"} según tu modelo)',
    example: { deliveryDate: 'desc' },
  })
  @IsOptional()
  @IsObject()
  orderBy?: Record<string, any>;
}
