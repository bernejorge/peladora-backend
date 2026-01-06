import { Unit } from './../../../generated/prisma/client';

export class CreateProductDto {
  name: string;
  description?: string;
  unit: Unit;
}
