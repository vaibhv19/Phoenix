# FastAPI AI & Retrieval Engine

This module drives the heavy natural language processing (NLP) pipelines, dense vector encodings, sparse keyword scoring, re-ranking computations, and local LLM state orchestrations for Phoenix.

---

## 1. Core Responsibilities & Retrieval Architecture

The FastAPI engine hosts the RAG pipeline components:
1. **Document Ingest & Parser**: Extracts layout text coordinates from uploaded PDFs via `pypdf`, split-chunks character sequences via `RecursiveCharacterTextSplitter` (size: 800, overlap: 150), and embeds segments via `all-MiniLM-L6-v2`.
2. **Dual-Retrieval Core**:
   * *Vector Search*: Cosine similarity computed against 384-dimensional dense vectors in PostgreSQL via `pgvector` operators (`<=>`).
   * *Keyword Search*: Dynamic `rank_bm25` index built on-the-fly from the specific document's database chunks.
3. **Score Fusion**: Normalizes BM25 scores via `MinMaxScaler` and blends them with vector similarity using a Weighted Linear Combination (WLC) ($\alpha = 0.7$).
4. **Fallback Orchestrator State Machine**: Coordinates query degradation paths. Triggers query rewrites (Yellow), FlashRank reranking (Orange), or aborts synthesis to generate clarification prompts (Red) based on consensus confidence scores.

---

## 2. Directory Layout

```text
ai-engine/
├── app/
│   ├── main.py              # FastAPI application server and REST routing
│   ├── config.py            # Environment configurations (Pydantic Settings)
│   ├── database.py          # SQLAlchemy Session and engine configurations
│   ├── models.py            # SQLAlchemy database tables mapping
│   ├── services/
│   │   ├── ingestion.py     # Document text slicing & embedding database inserts
│   │   ├── search_vector.py # pgvector cosine similarity SQL queries
│   │   ├── search_keyword.py# rank_bm25 dynamic indexing
│   │   ├── fusion.py        # MinMaxScaler and WLC fusion formula
│   │   ├── confidence.py    # MaxSim and Consensus Agreement calculator
│   │   ├── llm.py           # Ollama client and prompt constructors
│   │   └── fallback.py      # Tiered fallback state machine orchestrator
│   └── tests/               # pytest test cases
└── requirements.txt         # Package dependencies list
```

---

## 3. Configuration & Startup

### Prerequisites
* Python 3.11+
* Active PostgreSQL database running on port `5432` with the `vector` extension loaded.

### 1. Installation
Initialize a Python virtual environment and install core packages:
```bash
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # Unix/macOS
pip install -r requirements.txt
```

### 2. Configure Environment (`ai-engine/.env`)
Ensure connection parameters match your database setup:
```bash
database_url=postgresql://postgres:postgres@localhost:5432/phoenix
llm_provider=ollama
reranker_provider=flashrank
ollama_url=http://localhost:11434
ollama_model=mistral
flashrank_model=ms-marco-MiniLM-L-6-v2
embedding_model=all-MiniLM-L6-v2
```

### 3. Start Application
```bash
python -m uvicorn app.main:app --port 8000 --reload
```

---

## 4. Troubleshooting & Debugging

* **First-run Query Latency (ONNX Cache)**: The first time a query falls back to the Orange Path (FlashRank Reranking), FlashRank downloads the ONNX weights model from Hugging Face, causing a processing delay of up to 45 seconds. The model is cached locally for subsequent queries.
* **Ollama Connection Refused**: If query generation crashes with connection errors, ensure the Ollama server is running locally on port `11434` (`ollama run mistral`).
* **Timeout Incompatibilities**: Ensure the FastAPI uvicorn worker timeout is aligned with the Spring Boot RestClient read timeout (300 seconds) to prevent premature connection cancellations during weight loading.
