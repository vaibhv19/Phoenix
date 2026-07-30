# Provider & Dependency Strategy: Phoenix

This document defines the software providers, language models, retrieval algorithms, and database engines integrated into **Phoenix**, along with their configurations and execution strategies.

---

## 1. Provider Landscape & Responsibilities

Phoenix runs 100% locally to maintain offline privacy, eliminate external cloud API subscription costs, and simplify local portfolio execution.

```mermaid
graph TD
    Client[React Client] --> BE[Spring Boot API]
    BE --> DB[(PostgreSQL + pgvector)]
    BE --> Storage[(Local File Storage)]
    BE --> AI[FastAPI Engine]
    AI --> SentTrans[Sentence Transformers]
    AI --> BM25[rank_bm25]
    AI --> FlashRank[FlashRank Ranker]
    AI --> Ollama[Ollama Server]
    Ollama --> Mistral[Mistral 7B LLM]
```

| Provider / Tool | Component | Responsibility | Configuration Variables |
| :--- | :--- | :--- | :--- |
| **Ollama** | LLM Engine | Text Generation, Query Expansion, Clarifications | `OLLAMA_URL`, `OLLAMA_MODEL` |
| **Sentence-Transformers** | Embedding Provider | Text Chunk Semantic Encoding (384-d vectors) | `EMBEDDING_MODEL` |
| **FlashRank** | Reranking Engine | CPU-bound Cross-Encoder score refinement | `FLASHRANK_MODEL`, `RERANKER_PROVIDER` |
| **PostgreSQL & pgvector** | Database / Vector Store | Relational schemas, vectors storage, cosine searches | `SPRING_DATASOURCE_URL`, `DATABASE_URL` |
| **Local File System** | Storage Layer | Raw PDF binary file uploads retention | `UPLOAD_DIR` |

---

## 2. Component Strategies & Rationale

### 2.1 LLM Generation: Ollama (Mistral-7B)
* **Model Choice**: `mistral` (7 Billion parameter model).
* **Rationale**: Offers high performance for technical reasoning and code analysis while fitting comfortably within the memory footprint of consumer hardware.
* **Timeout Mitigation**: A local LLM can take time to start and compile weights on first-run. To prevent request failures, the HTTP read timeout has been set to **5 minutes (300 seconds)** in:
  * Spring Boot outbound client: [RestClientConfig.java](../backend/src/main/java/com/resume/phoenix/document/config/RestClientConfig.java#L19)
  * FastAPI Ollama HTTPX client: [llm.py](../ai-engine/app/services/llm.py#L76)

### 2.2 Text Embedding: Sentence-Transformers (`all-MiniLM-L6-v2`)
* **Rationale**: Maps text to 384-dimensional space in a fraction of a second on standard CPUs, eliminating external token billing.

### 2.3 Reranking: FlashRank (`ms-marco-MiniLM-L-6-v2`)
* **Rationale**: Heavy BERT/Cross-Encoder models require GPU acceleration. FlashRank is optimized for lightweight CPU inference, making it perfect for our local Orange Path reranking step.
* **In-Memory Fallback**: If FlashRank encounters a runtime import or initialization failure, the system falls back to a deterministic **Mock Reranker** in [reranking.py](../ai-engine/app/services/reranking.py#L33) rather than crashing, scoring candidates down from `0.85`.

### 2.4 Vector Search: PostgreSQL with `pgvector`
* **Rationale**: Relational attributes (user credentials, projects, audit records) and vectors are kept in a single database.
* **Indexes**: Utilizes HNSW (Hierarchical Navigable Small World) for sub-millisecond similarity calculations, rather than flat-file FAISS indexes which require manual memory management.

---

## 3. Configuration Profiles

All configurations are driven by environment files (`backend/.env` and `ai-engine/.env`).

### 3.1 Spring Boot Environment (`backend/.env`)
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/phoenix
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_SECRET_KEY=dGhlLXBob2VuaXgtcmFnLWh5YnJpZC1yZXRyaWV2YWwtc3lzdGVtLXNlY3VyZS1rZXktMjAyNg==
PYTHON_AI_ENGINE_URL=http://localhost:8000
CORS_ALLOWED_ORIGINS=http://localhost:5173
UPLOAD_DIR=storage
```

### 3.2 FastAPI Environment (`ai-engine/.env`)
```bash
database_url=postgresql://postgres:postgres@localhost:5432/phoenix
llm_provider=ollama
reranker_provider=flashrank
ollama_url=http://localhost:11434
ollama_model=mistral
flashrank_model=ms-marco-MiniLM-L-6-v2
embedding_model=all-MiniLM-L6-v2
```
