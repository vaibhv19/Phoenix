# Phoenix — Transparent Self-Healing Hybrid RAG Workspace

Phoenix is a **Transparent Self-Healing Hybrid RAG** system designed specifically for technical documentation. Built using **Spring Boot 3.x**, **FastAPI**, and **React 18**, Phoenix bridges the "trust gap" inherent in black-box AI retrieval systems by making the entire retrieval, scoring, reranking, and fallback process fully observable and traceable for engineers.

---

## Why Phoenix?

In traditional Retrieval-Augmented Generation (RAG) systems, developers are forced to trust a single generated response without any visibility into how it was formulated. This model fails in technical workspaces for several reasons:

* **The Exact Match Dilemma**: Pure vector search is excellent at identifying semantic intent but frequently misses exact alphanumeric identifiers (like error codes, port numbers, or configuration flags) that sparse keyword search (BM25) would catch immediately.
* **The "Black Box" Trust Gap**: When an AI answers a query incorrectly, developers have no way to diagnose whether the error occurred during database retrieval, score fusion, reranking, or final answer generation.
* **Hallucinations on Weak Context**: Traditional RAG systems will attempt to synthesize an answer even when the underlying document search returns zero relevant context, leading to critical configuration hallucinations.

**Phoenix solves these issues by combining a hybrid search engine with a self-healing fallback state machine, while rendering the entire pipeline's reasoning path in real-time.**

---

## Core Pillars

### 🧭 Self-Healing Fallback Orchestration
A FastAPI-driven orchestrator state machine dynamically manages query degradation. If initial retrieval scores are weak, the system automatically rewrites queries, escalates to Cross-Encoder reranking, or falls back to interactive clarification prompts to avoid hallucinations.

### 🔍 Hybrid Retrieval Engine
Combines semantic dense vector search (PostgreSQL `pgvector` with `all-MiniLM-L6-v2`) and sparse keyword search (Custom Tokenizer + `BM25` ranking) using a Weighted Linear Combination (WLC) MinMaxScaler score fusion ($\alpha=0.7$).

### 📊 Agreement Confidence Matrix
Calculates semantic consensus across retrieved text segments. By evaluating MaxSim metrics and agreement scores among top chunks, the engine quantifies response reliability before synthesis occurs.

### 🛠️ Visual Reasoning Trace
An interactive, collapsible timeline that maps the exact lifecycle of a query. Developers can inspect routing paths, query rewrites, raw cosine similarities, BM25 scores, and final confidence levels in a terminal-like build log.

### 🔒 Secure Multi-Tenancy
Row-level JPA query boundaries and Spring Security token interceptors ensure absolute project separation. Users can only search, upload, or manage documents within their own workspace namespaces.

---

## Screenshots

> [!NOTE]
> *Visual assets will be captured and added to the `/assets` directory upon production deployment. Below is the intended layout.*

| Component | Target Showcase | Placeholder Link |
|---|---|---|
| **Retrieval Engine Workspace** | Technical chat interface showing monospace inputs, empty state diagnostic summaries, and active setting checks. | `![Retrieval Engine](/assets/preview_workspace.png)` |
| **Document Vault Catalog** | Dashed PDF drag-and-drop zone and dense file tree catalog lists. | `![Document Vault](/assets/preview_vault.png)` |
| **Reasoning Timeline** | Collapsed terminal logs demonstrating the Yellow/Orange/Red query self-healing escalations. | `![Reasoning Timeline](/assets/preview_timeline.png)` |
| **Citation Matrix** | Source card highlights syncing directly with lines in the active text bubble. | `![Citation Matrix](/assets/preview_citations.png)` |

---

## System Architecture

Phoenix is structured as a modular monorepo, separating administrative operations from core RAG compute services:

```text
phoenix/
├── backend/          # Spring Boot: Authentication, Project Namespaces, Document Storage
├── ai-engine/        # FastAPI: Embedding Generation, BM25 Indexing, Fallback Orchestration
├── frontend/         # React SPA: Workspace UI, Store-driven layouts, Reasoning timeline
└── Docs/             # Engineering Notes and Living Knowledge Base
```

*Note: For production deployments, it is recommended to replace the Mermaid runtime dynamically with static `.svg` visual exports located in `/assets/architecture.svg`.*

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

### Backend API
- **Language & Runtime**: Java 21, Spring Boot 3.3.x
- **Persistence**: Spring Data JPA, Hibernate, PostgreSQL
- **Schema Management**: Flyway database migrations
- **Security**: Spring Security, stateless JWT authentication

### AI Engine
- **Framework**: Python 3.11+, FastAPI, Uvicorn
- **vector Search**: `pgvector` extension, SQLAlchemy ORM
- **dense Embeddings**: HuggingFace `sentence-transformers` (all-MiniLM-L6-v2)
- **sparse Search**: `rank_bm25` (In-Memory on-the-fly indexing)
- **Reranker**: `FlashRank` Cross-Encoder (`ms-marco-TinyBERT-L-2-v2` ONNX)

### Frontend Client
- **Framework**: React 18 (Vite compiler)
- **State Management**: Zustand
- **Styling**: TailwindCSS (flat neutral technical palette)
- **Icons**: Lucide React
- **Testing**: Vitest, JSDOM

### Infrastructure & Tooling
- **Orchestration**: Docker Compose
- **Database**: PostgreSQL 16 (pgvector pre-loaded)
- **Dependency Management**: Maven (Java), pip (Python), npm (Frontend)

---

## Setup & Installation

### Prerequisites
Ensure the following are installed locally:
- Docker & Docker Compose
- Java JDK 21
- Node.js 18+ (npm)
- Python 3.11+

### 1. Start the Database Container
Launch the PostgreSQL database preconfigured with the vector extension:
```bash
docker compose up -d
```

### 2. Configure and Run the AI Engine
Initialize the Python environment, install required packages, and run the FastAPI server:
```bash
cd ai-engine
python -m venv .venv

# Activate Virtual Environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Start the Backend API
Compile and package the Spring Boot microservice. The Flyway engine automatically initializes the database tables on startup:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 4. Initialize the Frontend UI
Install local npm libraries and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Configuration & Environment variables

Ensure the following default connection properties are defined in your active environment:

| Service | Environment Variable | Default Value | Description |
|---|---|---|---|
| **Database Container** | `POSTGRES_DB` / `POSTGRES_USER` | `phoenix` / `postgres` | Configured inside `docker-compose.yml` |
| **Spring Boot API** | `spring.datasource.url` | `jdbc:postgresql://localhost:5432/phoenix` | Spring Boot Database Connection URL |
| **Spring Boot API** | `ai.engine.url` | `http://localhost:8000` | FastAPI Engine backend URL |
| **Python FastAPI** | `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/phoenix` | SQLAlchemy pgvector connection string |

---

## Core API Reference

### Authentication Gateway
* `POST /api/auth/register` - Create a new developer account.
* `POST /api/auth/login` - Authenticate credentials and return a Bearer JWT token.

### Project Management
* `GET /api/projects` - List all projects owned by the authenticated tenant.
* `POST /api/projects` - Initialize a new project workspace.
* `DELETE /api/projects/{projectId}` - Delete a project workspace (cascades chunk deletions).

### Document Ingestion
* `GET /api/projects/{projectId}/documents` - List all uploaded technical manuals in the vault.
* `POST /api/projects/{projectId}/upload` - Upload a technical PDF manual.

### AI Engine (Internal Endpoints)
* `POST /internal/v1/ingest` - Receives PDF layout text, generates semantic vectors, and saves chunks.
* `POST /internal/v1/process-base` - Returns raw hybrid retrieved chunks and MinMaxScaler similarity scores.
* `POST /internal/v1/process` - Coordinates fallback orchestration and outputs synthesized responses.

---

## Project Roadmap

The following enhancements are proposed for future development cycles:
- [ ] **Streaming Responses**: Implement Server-Sent Events (SSE) for chunk-by-chunk token rendering.
- [ ] **Multi-Document Retrieval**: Enable cross-document search boundaries within a single project namespace.
- [ ] **Evaluation Framework**: Integrate automated RAG evaluation metrics (e.g. Ragas / TruLens) for retrieval accuracy tracking.
- [ ] **LangGraph Orchestration**: Refactor the custom state machine into a LangGraph agent system for complex routing paths.
- [ ] **Distributed Vector Stores**: Integrate external vector services (like pgvector cluster nodes) for massive document scaling.

---

## Demo & Deployment

> [!TIP]
> *Production deployment links and system walk-through videos will be added here once the staging pipeline is initialized.*

- **Live Staging Application**: `[Staging URL Placeholder]`
- **Video Walkthrough**: `[YouTube Demonstration Placeholder]`
