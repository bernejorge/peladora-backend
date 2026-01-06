import { ApiPropertyOptional } from '@nestjs/swagger';
import { Unit } from './../../../generated/prisma/client';

export class UpdateProductDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ enum: Unit })
  unit?: Unit;

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional()
  price?: number; // ahora opcional también aquí
}
