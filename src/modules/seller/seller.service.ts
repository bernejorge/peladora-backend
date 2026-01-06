/* eslint-disable */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSellerDto) {
    return this.prisma.seller.create({ data });
  }

  findAll() {
    return this.prisma.seller.findMany({
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: number) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
    });
    if (!seller) throw new NotFoundException(`Seller ${id} not found`);
    return seller;
  }

  async update(id: number, data: UpdateSellerDto) {
    await this.findOne(id);
    return this.prisma.seller.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.seller.delete({ where: { id } });
  }
}
