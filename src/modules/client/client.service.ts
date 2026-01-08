/* eslint-disable  */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { generateEmbedding } from '../../utils/openai.utils';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateClientDto) {
    try {
      // calculá el embedding semántico para el nombre
      const vector = await generateEmbedding(data.name);

      const client = await this.prisma.client.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          // Lo actualizás después si querés
        },
      });

      if (vector.length) {
        await this.prisma.$executeRaw`
      UPDATE "Client"
      SET embedding = ${JSON.stringify(vector)}::vector
      WHERE id = ${client.id}
    `;
      }

      return client;

    }catch (error){
      console.error('Error creating client:', error);
      throw error;
    }
    
  }

  findAll() {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });
    if (!client) throw new NotFoundException(`Client ${id} not found`);
    return client;
  }

  async update(id: number, data: UpdateClientDto) {
    const existing = await this.findOne(id);

    if (data.name && data.name !== existing.name) {
      const newVector = await generateEmbedding(data.name);

      // Actualizá el vector en la DB con SQL crudo
      await this.prisma.$executeRaw`
      UPDATE "Client"
      SET embedding = ${JSON.stringify(newVector)}::vector
      WHERE id = ${id}
    `;
    }

    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }
}

