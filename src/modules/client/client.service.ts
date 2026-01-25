/* eslint-disable  */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { generateEmbedding } from '../../utils/openai.utils';
import { PgVectorUtils } from '../../utils/pgvector.utils';
import { toSql } from 'pgvector';
import { promises } from 'dns';

@Injectable()
export class ClientService {
  private readonly pgVectorUtils: PgVectorUtils;

  constructor(private readonly prisma: PrismaService) {
    this.pgVectorUtils = new PgVectorUtils(this.prisma);
  }

  async create(data: CreateClientDto) {
    try {
      // calculá el embedding semántico para el nombre
      const normalizedName = data.name.toUpperCase();

      const vector = await generateEmbedding(normalizedName);
      const client = await this.prisma.client.create({
        data: {
          name: normalizedName,
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

    } catch (error) {
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

      const embedding = toSql(newVector);
      // Actualizá el vector en la DB con SQL crudo
      await this.prisma.$executeRaw`
      UPDATE "Client"
      SET embedding = ${embedding}::vector
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

  /**
   * Busca clientes por nombre/texto usando embeddings semánticos.
   * Devuelve un arreglo de clientes ordenados por similitud de coseno.
   */
  async searchByNameSemantic(text: string, limit = 5) : Promise<CreateClientDto[]> {
    try {

      if(!text || text.trim().length === 0) {
        throw new Error('El texto de búsqueda no puede estar vacío');     
      }
      // 1) Generar embedding 
      const queryEmbedding = await generateEmbedding(text);

      if (!queryEmbedding || queryEmbedding.length === 0) {
        return [];
      }

      // 2) Buscar usando helper con similitud de coseno
      const results: any[] = await this.pgVectorUtils.searchByCosineSimilarity( 
        'Client',
        'embedding',
        queryEmbedding,
        limit,
      );

      return results.map(({ id, name, email, phone, address, notes }) => ({
        id,
        name,
        email,
        phone,
        address,
        notes,
      }));
    } catch (error) {
      console.error('Error searching clients by semantic name:', error);
      throw error;
    }
  }
}

