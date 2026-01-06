/* eslint-disable */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProductDto) {
    const productCreated = this.prisma.product.create({ data });
    return productCreated;
  }

  findAll() {
    const products = this.prisma.product.findMany({ orderBy: { name: 'asc' } });
    return products;
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async update(id: number, data: UpdateProductDto) {
    // 1. Verificar si el producto existe
  const product = await this.prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundException(`Product ${id} not found`);
  }

  // 2. Registrar histórico si el precio cambia
  if (data.price !== undefined && data.price !== Number(product.price)) {
    await this.prisma.priceHistory.create({
      data: {
        productId: id,
        price: product.price,
      },
    });
  }

  // 3. Actualizar el producto
  return this.prisma.product.update({
    where: { id },
    data,
  });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}