CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE document_chunks ADD COLUMN content TEXT;
ALTER TABLE document_chunks ADD COLUMN metadata JSONB;
ALTER TABLE document_chunks ADD COLUMN embedding VECTOR(384);
