-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "embedding" vector;
