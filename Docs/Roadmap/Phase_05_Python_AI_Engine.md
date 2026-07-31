# Phase 5 — Python AI Engine Playbook

This document details the audit, retrofit strategy, and upgraded implementation playbook for establishing the FastAPI AI Ingestion Engine, handling PDF parsing, chunking, and embedding persistence using `pgvector`.

---

## 1. Phase Audit

During the audit of the original Phase 5 roadmap, the following gaps and critical engineering issues were identified:
- **SQLAlchemy Metadata Keyword Collision**: The database schema defines a JSONB column named `metadata` inside `document_chunks`. In SQLAlchemy, mapping a class variable named `metadata` causes a collision with SQLAlchemy's internal class variable `Base.metadata`. The actual implementation resolves this by naming the class variable `chunk_metadata` and mapping it to the column name `"metadata"` (e.g. `Column("metadata", JSONB)`). This was undocumented.
- **Service Name & Directory Path**: The roadmap referenced the directory as `phoenix-ai/`, whereas the actual folder is `ai-engine/`.
- **Model Cache Location**: SentenceTransformers downloads models from HuggingFace to the user's home folder (`~/.cache/torch/sentence_transformers`). This was undocumented, causing disk space issues or download delays during air-gapped server configurations.
- **Idempotency Logic**: The roadmap did not detail what happens when the same document is uploaded multiple times. The actual implementation in `VectorStoreService.insert_document_chunks` deletes any existing chunks for the target document ID before running a bulk insert transaction.

---

## 2. Retrofit Strategy

To convert this phase into a reliable engineering execution guide:
1. **Highlight the SQLAlchemy model mapping workaround**: Provide code examples of mapping `chunk_metadata = Column("metadata", JSONB)`.
2. **Document local model caching**: Explain that `all-MiniLM-L6-v2` is downloaded automatically on first startup.
3. **Capture API contracts**: Document the request and response shapes for `POST /internal/v1/ingest`.
4. **Detail the chunking logic**: Outline page-by-page metadata preservation.

---

## 3. Upgraded Implementation Playbook

### 3.1 Phase Overview
- **Objective**: Bootstrap the FastAPI service, parse uploaded technical manuals page-by-page, chunk text, compute dense vector representations, and store them in PostgreSQL.
- **Purpose**: Creates the searchable text indices for semantic retrieval.
- **Expected Outcome**: Running the ingest API splits a PDF and populates the `document_chunks` table with 384-dimensional vector float arrays.
- **Dependencies**: Phase 4 (Upload structure active), PostgreSQL with `pgvector` container active.

### 3.2 Prerequisites
- Python 3.11+ environment with `pip` and `venv` installed.
- Active Docker Postgres database running.
- Sequence migration `V3` (creating `documents` and `document_chunks` tables) executed on the database.

### 3.3 Environment Configuration
Ensure `ai-engine/.env` contains:
```env
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/phoenix
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### 3.4 Dependencies
Verify `ai-engine/requirements.txt` contains:
- `fastapi` & `uvicorn` (FastAPI app runner).
- `sqlalchemy` (ORM).
- `pgvector` (SQLAlchemy extension for vector math).
- `pypdf` (Text extraction).
- `langchain-text-splitters` (Recursive chunking).
- `sentence-transformers` (Local embedding model).

### 3.5 Implementation Guide

#### Step 1: Write Database Connector (`app/database.py`)
Establish the database engine and session boundaries:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### Step 2: Implement ORM Models (`app/models.py`)
Map the database tables, paying special attention to naming collisions:
- **`DocumentChunk` Class**:
  - `id`: Column(UUID, primary_key=True)
  - `document_id`: Column(UUID, ForeignKey("documents.id", ondelete="CASCADE"))
  - `chunk_index`: Column(Integer)
  - `vector_store_id`: Column(String)
  - `content`: Column(Text)
  - `chunk_metadata`: Column("metadata", JSONB) # Workaround: maps field name 'metadata' to class variable 'chunk_metadata'
  - `embedding`: Column(Vector(384)) # 384 dimensions matching all-MiniLM-L6-v2

#### Step 3: Implement Ingestion Extraction Service (`app/services/ingestion.py`)
1. **`PDFExtractor.extract_pages`**: Uses `pypdf.PdfReader` to extract text from a physical file. Loops page-by-page, returning maps containing page numbers and text.
2. **`DocumentChunker.chunk_pages`**: Uses LangChain's `RecursiveCharacterTextSplitter` configured with a chunk size of 800, overlap of 150, and delimiters `["\n\n", "\n", " ", ""]`. Splitting page text yields chunks that carry a `page_number` in their metadata.

#### Step 4: Write Embedding and Vector Storage Services (`app/services/vector_store.py`)
1. **`EmbeddingService`**: Initializes `SentenceTransformer("all-MiniLM-L6-v2")`. Exposes `embed_batch(texts)` to compute embeddings in batch, returning lists of floats.
2. **`VectorStoreService.insert_document_chunks`**:
   - Executes `db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()` for idempotency.
   - Loops through chunks, generating a UUID for `vector_store_id`.
   - Saves ORM `DocumentChunk` models, adding the float embedding lists.
   - Commits transaction session.

#### Step 5: Configure FastAPI Ingestion REST Endpoint (`app/main.py`)
Expose `POST /internal/v1/ingest`:
- Inputs: `documentId` (UUID), `filePath` (String), and `config` object (chunkSize, chunkOverlap).
- Runs PDF parsing, chunking, and batch embedding generation.
- Returns status `COMPLETED` and total chunks on success; returns `FAILED` inside a custom JSON output on Exception catches.

### 3.6 Manual Engineering Work
The developer must activate the Python virtual environment and run the FastAPI server:
```bash
cd ai-engine
.venv\Scripts\activate
uvicorn app.main:app --port 8000 --reload
```
On first boot, the system downloads weights for `all-MiniLM-L6-v2` (~120MB) to the HuggingFace cache folder.

### 3.7 Integration Steps
Verify connection boundaries:
- The Spring Boot backend makes a POST request to `http://localhost:8000/internal/v1/ingest` with the target file path.
- The Python engine processes the local file directly.

### 3.8 Verification

#### 1. Ingest Request Payload:
```bash
curl -X POST http://localhost:8000/internal/v1/ingest \
     -H "Content-Type: application/json" \
     -d '{"documentId":"a50c82fb-5730-4e3a-9694-dfad84b39178","filePath":"D:\\Coding\\Projects----For Resume\\Phoenix\\backend\\storage\\a50c82fb-5730-4e3a-9694-dfad84b39178.pdf","config":{"chunkSize":800,"chunkOverlap":150}}'
```
**Expected Response (200 OK)**:
```json
{
  "documentId": "a50c82fb-5730-4e3a-9694-dfad84b39178",
  "chunkCount": 24,
  "embeddingStatus": "COMPLETED",
  "vectorIndexName": "idx_doc_a50c82fb-5730-4e3a-9694-dfad84b39178",
  "processingTimeMs": 1420
}
```

#### 2. SQL Check:
Connect to PostgreSQL and query chunks:
```sql
SELECT count(*), document_id FROM document_chunks GROUP BY document_id;
```
**Expected Outcome**: Document ID returns matching chunk counts, and `embedding` contains float arrays of length 384.

```mermaid
flowchart TD
    Request([POST Ingest Request]) --> Extractor[PDFExtractor: Read PDF]
    Extractor --> Chunker[DocumentChunker: Recursive Splitter]
    Chunker --> Embedder[EmbeddingService: all-MiniLM-L6-v2]
    Embedder --> Cleaner[VectorStoreService: Delete Old Chunks]
    Cleaner --> Inserter[VectorStoreService: Bulk Insert Chunks & Embeddings]
    Inserter --> Response([Return Success JSON])
```

### 3.9 Troubleshooting

#### Issue 1: HuggingFace Timeout / Connection Failures
- **Symptoms**: Service hangs on startup, or first `/ingest` request fails with `HTTPError` from huggingface.co.
- **Root Cause**: The local development machine lacks internet access to download model weights.
- **Resolution**: Ensure active internet connection during initial startup, or manually copy model files to the HuggingFace cache folder: `C:\Users\<user>\.cache\torch\sentence_transformers\`.

#### Issue 2: pgvector Class Mapping Errors
- **Symptoms**: SQLAlchemy throws `AttributeError: module 'pgvector.sqlalchemy' has no attribute 'Vector'`.
- **Root Cause**: The installed version of the `pgvector` python package is old.
- **Resolution**: Ensure `requirements.txt` specifies `pgvector>=0.2.0` and run `pip install --upgrade pgvector`.

### 3.10 Completion Checklist
- [x] Python database connector successfully handles sessions.
- [x] ORM model uses the `chunk_metadata` property rename workaround to avoid collisions.
- [x] PDF extractor processes technical manuals page-by-page.
- [x] Recursive chunking splits text on structure separators.
- [x] Embedding outputs have exactly 384 dimensions.
- [x] `/internal/v1/ingest` executes successfully, persisting chunks and vector metrics.

### 3.11 Lessons Learned
- **SQLAlchemy Naming Workarounds**: When mapping a column that matches a reserved framework keyword (e.g. `metadata`), use SQLAlchemy's column naming aliasing properties to isolate the database column layout from internal Python engine classes.
