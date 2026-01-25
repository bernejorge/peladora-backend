/* eslint-disable  */
import { PrismaClient } from '../generated/prisma/client';
import { toSql } from 'pgvector';

export class PgVectorUtils {
   constructor(private prisma: PrismaClient) { }

   /**
    * Actualiza un campo de tipo vector en una tabla dada.
    * @param table Nombre de la tabla (exactamente como está en la DB)
    * @param idField Nombre del campo identificador (p. ej. "id")
    * @param id Valor del identificador
    * @param vectorField Nombre del campo vector (p. ej. "embedding")
    * @param vectorValue Arreglo de números (embedding)
    */
   async updateVectorField(
      table: string,
      idField: string,
      id: number | string,
      vectorField: string,
      vectorValue: number[],
   ) {
      // Convierte el vector a JSON para pasarlo al query raw
      const vectorJson = JSON.stringify(vectorValue);

      // Generá la consulta safe: escapado de identificadores
      const sql = `
      UPDATE "${table}"
      SET "${vectorField}" = ${vectorJson}::vector
      WHERE "${idField}" = ${id};
    `;

      return this.prisma.$executeRawUnsafe(sql);
   }

   async searchByCosineSimilarity(
      table: string,
      vectorField: string,
      queryVector: number[],
      limit = 4,
   ) {
      try {
         
         const queryEmbedding = toSql(queryVector);

         const sql = `
      SELECT *, "${vectorField}" <=> '${queryEmbedding}' AS distance
      FROM "${table}"
      ORDER BY "${vectorField}" <=> '${queryEmbedding}'
      LIMIT ${limit};
    `;

         const result = await this.prisma.$queryRawUnsafe(sql);
         const response = result as Array<any>;
         return response;
      } catch (error) {
         console.error('Error in searchByCosineSimilarity:', error);
         throw error;
      }

   }

}
