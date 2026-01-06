import { Unit } from './../../../generated/prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  unit: Unit;

  @ApiProperty()
  weight: number;

  @ApiProperty({ example: 0 })
  price: number;

  @ApiProperty({ required: false })
  description?: string;
}
