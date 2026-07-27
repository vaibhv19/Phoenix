# Phoenix — Transparent Self-Healing Hybrid RAG Workspace

Phoenix is a production-grade, multi-tenant technical document investigation workspace that utilizes a **Transparent Self-Healing RAG** architecture. Built with **Spring Boot 3.x**, **FastAPI**, and **React 18**, Phoenix bridges the "trust gap" in AI systems by making the retrieval, reranking, and response synthesis process observable to developers.

---

## Key Features

1. **Self-Healing Fallback Orchestration**: A FastAPI orchestrator state machine dynamically manages query degradation and retrieval failures. If direct matches are weak, it automates query rewrites, scales to cross-encoder reranking, and falls back to interactive clarification prompts.
2. **Hybrid Retrieval Engine**: Combines semantic dense vector search (PostgreSQL `pgvector` with `all-MiniLM-L6-v2`) and sparse keyword search (Custom Tokenizer + `BM25` ranking) using a Weighted Linear Combination (WLC) MinMaxScaler score fusion.
3. **Agreement Confidence Matrix**: Calculates semantic consensus (MaxSim metrics and agreement scores) across retrieved chunks to evaluate response reliability before answer generation.
4. **Visual Reasoning Trace**: An interactive collapsible timeline rendering the exact routing, query rewrites, and confidence levels computed during the RAG lifecycle.
5. **Secure Multi-Tenant Isolation**: Row-level JPA query tenant boundaries and Spring Security filters guarantee absolute boundary isolation (User B is blocked from reading/writing User A's projects or manuals).

---

## System Architecture

Phoenix is organized as a monorepo containing three core modules:

```text
phoenix/
├── backend/          # Spring Boot REST API, Project Ingestion, Storage, Security
├── ai-engine/        # FastAPI RAG Ingest, Embeddings, BM25, Fallback Orchestration
├── frontend/         # React SPA (Vite, Zustand, Tailwind, Lucide Icons)
└── Docs/             # Engineering Notes and Learning Knowledge Base
```

### Hybrid Retrieval Interaction Flow

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

### Confidence Engine Dependency Graph

```mermaid
graph TD
    VectorSearchService --> RetrievalService
    KeywordSearchService --> RetrievalService
    ConfidenceService --> RetrievalService
    MaxSimExtractor --> ConfidenceService
    AgreementCalculator --> ConfidenceService
    RetrievalService --> FastAPI_Endpoint[FastAPI Endpoint /internal/v1/process-base]
```

---

## Technology Stack

- **Backend API**: Java 21, Spring Boot 3.3.x, Spring Data JPA, Spring Security (JWT), Flyway migrations.
- **AI Core**: Python 3.11+, FastAPI, PostgreSQL + `pgvector` driver, SQLAlchemy.
- **LLM/Reranking**: `sentence-transformers` (all-MiniLM-L6-v2), `FlashRank` Cross-Encoder, query rewriting.
- **Frontend SPA**: React 18, Zustand state stores, TailwindCSS (neutral technical style), Vitest/jsdom testing.
- **Infrastructure**: Docker Compose, PostgreSQL 16.

---

## Setup & Installation

### Prerequisites
- Docker & Docker Compose
- Java JDK 21
- Node.js 18+ (npm)
- Python 3.11+

### 1. Database Infrastructure Setup
Launch the PostgreSQL database container pre-loaded with the `pgvector` extension:
```bash
docker compose up -d
```

### 2. AI Engine Setup
Create a virtual environment, install dependencies, and start the FastAPI service:
```bash
cd ai-engine
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Unix/macOS
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Backend Setup
Compile the project and start the Spring Boot application. Flyway will automatically run database schema migrations on start:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 4. Frontend Setup
Install npm packages and launch the Vite development server:
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables Configuration

Ensure the following default ports and configurations are available in your local setup:

| Service | Environment Key / Config | Default Value | Description |
|---|---|---|---|
| **Database** | `POSTGRES_DB` / `POSTGRES_USER` | `phoenix` / `postgres` | Credentials inside `docker-compose.yml` |
| **Backend** | `spring.datasource.url` | `jdbc:postgresql://localhost:5432/phoenix` | Spring Boot Database URL |
| **Backend** | `ai.engine.url` | `http://localhost:8000` | FastAPI Server endpoint |
| **AI Engine**| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/phoenix` | SQLAlchemy connection string |

---

## Core API Reference

### Backend Gateway Endpoints
- `POST /api/auth/register` - Create developer account.
- `POST /api/auth/login` - Authenticate account and receive JWT.
- `GET /api/projects` - List all projects owned by authenticated user.
- `POST /api/projects` - Create a project.
- `POST /api/projects/{projectId}/upload` - Ingest technical PDF manual.
- `GET /api/projects/{projectId}/documents` - List uploaded files and statuses.

### AI Retrieval Endpoints (Internal)
- `POST /internal/v1/ingest` - Split PDF extract, generate dense embeddings, and save vectors.
- `POST /internal/v1/process-base` - Query RAG engine (returns WLC fused vector/BM25 chunks).
- `POST /internal/v1/process` - Query orchestrator (executes fallback state machine and synthesizes response).

---

## License & Acknowledgements
Built as a professional portfolio project demonstrating advanced RAG, multi-tenant database designs, and custom fallback architectures. Acknowledgements to the pgvector, Hugging Face, and FastAPI communities.
