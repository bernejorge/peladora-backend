import { OpenAI } from 'openai';

const key = process.env.OPENAI_API_KEY;
console.log('OpenAI API Key:', key);
/**
 * Configurá el cliente de OpenAI.
 * Asegurate de tener definida la variable de entorno OPENAI_API_KEY.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Genera un embedding para un texto dado usando el modelo text-embedding-3-small.
 * @param text Texto a convertir en vector
 * @returns Array de números (embeddings)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text) return [];

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  // Extrae el embedding (primer vector en data)
  const embedding = response.data[0].embedding;

  return embedding;
}
