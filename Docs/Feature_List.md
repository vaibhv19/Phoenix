# Phoenix — Feature List

## Spring Boot API Layer (Java Backend / Full Stack)

- Auth (JWT)
- User & project management
- Document upload handling (PDFs → passed to AI engine for processing)
- Internal API contract to Python AI Engine (REST)
- Stores metadata: documents, chunks reference, query history
- Core engineering: validation, exception handling, pagination

## React Frontend (completes Full Stack)

- Upload documents
- Ask questions / chat interface
- Show retrieved sources + confidence level
- Show fallback reasoning when retrieval had to self-correct (this is the differentiator — surface why the system did what it did, not just the final answer)

## Python AI Engine (AI Engineer dedicated / Python AI Eng)

- Document ingestion: chunking + embeddings
- Vector store (Pinecone/pgvector/FAISS)
- Hybrid search: vector + keyword (BM25), not vector-only
- Confidence scoring on retrieved chunks
- Fallback strategies triggered on low confidence:
  - Query rewriting (reformulate and retry)
  - Re-ranking retrieved chunks
  - Ask user a clarifying question instead of guessing
- Source citations in every answer
- Design principle: system should know when it doesn't know, rather than always answering confidently

## Domain

RAG over technical docs (Spring Boot / AWS) — chosen because exact-match terms (config keys, exception names) let you concretely demonstrate hybrid search beating vector-only search.
