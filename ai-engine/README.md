# FastAPI AI & Retrieval Engine

This module coordinates the RAG ingestion pipeline, pgvector + BM25 hybrid searches, confidence scoring, query rewriting, reranking, and fallback state orchestration.

---

## 1. Technical Overview

The engine is built on **FastAPI** and integrates:
1. **dense Semantic Embeddings**: Utilizes the local `all-MiniLM-L6-v2` transformer model (384 dimensions) to map chunk embeddings.
2. **sparse Keyword Indices**: Employs `rank_bm25` in memory on-the-fly, scoped strictly to the current document ID.
3. **WLC MinMaxScaler Fusion**: Normalizes BM25 scores and vector cosine similarities, combining them using a Weighted Linear Combination (WLC) formula ($\alpha=0.7$).
4. **Confidence Matrix Evaluation**: Computes semantic consensus (MaxSim and agreement metrics) over top-retrieved documents.
5. **Fallback Orchestrator State Machine**: Evaluates confidence and reranker scores, executing query rewrites (Yellow), FlashRank reranking (Orange), or clarifying prompts (Red) when needed.

---

## 2. Directory Layout

All core components and retrieval logic are located in the [app](app) folder:

```text
ai-engine/
├── app/
│   ├── main.py              # FastAPI initialization and REST routes
│   ├── config.py            # Pydantic Settings and database paths
│   ├── database.py          # SQLAlchemy Session and engine configuration
│   ├── models.py            # SQLAlchemy database tables mapping
│   ├── services/
│   │   ├── ingestion.py     # PDF parsing, recursive splitting, and vector insertion
│   │   ├── search_vector.py # pgvector cosine similarity search queries
│   │   ├── search_keyword.py# rank_bm25 index building and search
│   │   ├── fusion.py        # MinMaxScaler score scaling and WLC combination
│   │   ├── retrieval.py     # Hybrid search orchestration manager
│   │   ├── confidence.py    # MaxSim matrices and Agreement scoring calculator
│   │   ├── llm.py           # LLM API queries, rewrites, and clarification generation
│   │   └── fallback.py      # Self-healing routing state machine
│   └── tests/               # pytest suites and property sensitivity benchmark
└── requirements.txt         # Pip dependency list
```

* **V1 Entry Point**: API endpoints and routes are initialized in [app/main.py](app/main.py).
* **Settings Manager**: Server configs are loaded via Pydantic in [app/config.py](app/config.py).
* **Storage Ingestion**: Text chunking and embedding calculations occur in [app/services/ingestion.py](app/services/ingestion.py).
* **Hybrid Core**: Retrieval and score logic resides in [app/services/retrieval.py](app/services/retrieval.py), [app/services/fusion.py](app/services/fusion.py), and [app/services/confidence.py](app/services/confidence.py).
* **Recovery Routing**: Fallback pipelines are orchestrated in [app/services/fallback.py](app/services/fallback.py).

---

## 3. Setup & Startup

### Prerequisites
* Python 3.11+
* Active PostgreSQL Database with `pgvector` extension

### 1. Installation
Set up a virtual environment and install core packages:
```bash
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # Unix/macOS
pip install -r requirements.txt
```

### 2. Environment Variables
Configure the database link in your terminal or env context in the [.env](.env) file:
```bash
database_url=postgresql://postgres:postgres@localhost:5432/phoenix
```

### 3. Startup
Start the FastAPI server using Uvicorn:
```bash
python -m uvicorn app.main:app --port 8000 --reload
```

---

## 4. REST Endpoints (Internal Interface)

* `POST /internal/v1/ingest`: Triggers the parsing, character chunking, embedding generation, and vector insertion. Mapped in [app/main.py](app/main.py#L51).
* `POST /internal/v1/process-base`: Runs primary hybrid vector + BM25 keyword search. Mapped in [app/main.py](app/main.py#L105).
* `POST /internal/v1/process`: Executes the self-healing fallback orchestration. Mapped in [app/main.py](app/main.py#L152).

---

## 5. Testing & Benchmarking

Execute the unit/integration tests and property sensitivity benchmark using:
```bash
.venv\Scripts\python -m pytest
```
* **[test_fallback.py](app/tests/test_fallback.py)**: Validates all state machine path transitions (Green, Yellow, Orange, Red).
* **[test_sensitivity.py](app/tests/test_sensitivity.py)**: Runs a benchmark comparing Hybrid search accuracy against Vector search, asserting Hit Rate @ 1 metrics.
