// src/modules/client/dto/create-client.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'María González' })
  name: string;

  @ApiPropertyOptional({ example: 'maria.gonzalez@mail.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+54 9 341 9876543' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Av. San Martín 456, Rosario' })
  address?: string;

  @ApiPropertyOptional({ example: 'Cliente frecuente' })
  notes?: string;
}
