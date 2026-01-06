import { Unit } from './../../../generated/prisma/client';

export class UpdateProductDto {
  name?: string;
  description?: string;
  unit?: Unit;
}
