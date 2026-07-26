# Phoenix

Phoenix is a high-performance RAG-based AI search and retrieval platform.

## Hybrid Retrieval Engine Component Interaction

This diagram details the flow of execution when a client hits the hybrid retrieval endpoint:

```mermaid
sequenceDiagram
    autonumber
    Client ->> FastAPI Endpoint: POST /internal/v1/process-base (query, documentId, limit, alpha)
    FastAPI Endpoint ->> RetrievalService: retrieve_hybrid(document_id, query, limit, alpha)
    RetrievalService ->> EmbeddingService: embed_text(query)
    EmbeddingService -->> RetrievalService: query_embedding (384-dim list)
    
    par Vector Search
        RetrievalService ->> VectorSearchService: search(db, document_id, query_embedding, limit*2)
        VectorSearchService ->> DB: Query chunks (pgvector cosine similarity)
        DB -->> VectorSearchService: Chunks & Cosine Distance
        VectorSearchService -->> RetrievalService: List[(Chunk, Sim_vector)]
    and Keyword Search
        RetrievalService ->> KeywordSearchService: search(db, document_id, query, limit=None)
        KeywordSearchService ->> DB: Query all chunks for document_id
        DB -->> KeywordSearchService: Chunks
        KeywordSearchService ->> KeywordSearchService: custom_tokenizer() & rank_bm25
        KeywordSearchService -->> RetrievalService: List[(Chunk, Score_bm25_raw)]
    end
    
    RetrievalService ->> WLCFusion: fuse(vector_results, keyword_results, alpha)
    WLCFusion ->> MinMaxScaler: normalize(raw_bm25_scores)
    MinMaxScaler -->> WLCFusion: normalized_bm25_scores
    WLCFusion ->> WLCFusion: Match chunks by ID & compute WLC
    WLCFusion -->> RetrievalService: Sorted List[(Chunk, Score_final)]
    
    RetrievalService -->> FastAPI Endpoint: Top K matches
    FastAPI Endpoint -->> Client: JSON Response (matches, scores)
```
