/* eslint-disable  */
import { PrismaClient } from '../generated/prisma/client';

export class PgVectorUtils {
  constructor(private prisma: PrismaClient) {}

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
    limit = 5,
  ) {
    const qVec = JSON.stringify(queryVector);

    /**
     * Cosine similarity con pgvector se expresa como:
     *   1 - (vector <=> queryVector)
     * si usás vector_cosine_ops (index de cosine), o
     * usando la función cosine_distance
     *   1 - (embedding <#> queryVector)
     * pero la más portable es calcularlo como:
     *   (embedding <#> queryVector)
     * depende de la extensión.
     *
     * En pgvector, la forma de usar similarity explícita:
     *   SELECT *, (1 - (embedding <=> queryVector)) AS similarity
     * ORDER BY similarity DESC
     *   (si tenés vector_cosine_ops)
     *
     * Vamos a suponer que tu DB tiene vector_cosine_ops habilitado
     * para un índice pgvector con operadores de coseno.
     */
    const sql = `
      SELECT *, (1 - ("${vectorField}" <=> ${qVec}::vector)) AS similarity
      FROM "${table}"
      ORDER BY similarity DESC
      LIMIT ${limit};
    `;

    return this.prisma.$queryRawUnsafe(sql);
  }

}
