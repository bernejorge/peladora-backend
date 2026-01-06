// src/modules/seller/dto/create-seller.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSellerDto {
  @ApiProperty({ example: 'Juan' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiPropertyOptional({ example: 'juan.perez@mail.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+54 9 341 1234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Encargado de ventas zona norte' })
  notes?: string;
}
