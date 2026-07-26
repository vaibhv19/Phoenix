# Phase 5 — Python AI Engine

## 1. Module Overview: PDF Ingestion & Embeddings Pipeline

### Purpose
To accept local PDF paths, parse the text structures, split them into character-bounded segments, generate dense embeddings, and save both chunks and vector vectors to the `pgvector` store.

### Dependencies
- Phase 4 (Upload structure active).
- PostgreSQL with `pgvector` extension active.

### Inputs
- File storage path `filePath`.
- Ingestion configuration parameters (chunkSize, chunkOverlap).

### Outputs
- Persistent semantic vector entries in database.
- Processed metadata report including total chunk count.

---

## 2. Intended Folder Structure (Python AI Engine)

The Python RAG application layout:

```text
phoenix-ai/app/
├── main.py                          # FastAPI App configuration & routing
├── config.py                        # Settings parsing
├── database.py                      # SQLAlchemy database session manager
├── models.py                        # pgvector database models
├── services/
│   ├── ingestion.py                 # Text extraction & character splitting
│   └── vector_store.py              # Embedding generation & pgvector indexing
└── tests/
    ├── test_ingestion.py
    └── test_vector_store.py
```

---

## 3. Technology Configurations & Integrations

### Text Extraction:
- Python Library: `pypdf` or `pdfplumber` for robust text layer extraction.

### Text Splitting Parameters:
- Chunker: `RecursiveCharacterTextSplitter` from `langchain_text_splitters`.
- Size: 800 characters.
- Overlap: 150 characters.
- Separators: `["\n\n", "\n", " ", ""]` (forces splits on structure boundaries).

### Embedding Model:
- Model: `Sentence-Transformers/all-MiniLM-L6-v2`.
- Dimension size: 384.
- Persistence: Stored as a `VECTOR(384)` type in PostgreSQL using SQLAlchemy + `pgvector` integration.

---

## 4. Atomic Implementation Task List

### Task 5.1: Configure Python Database Module & pgvector Model
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 1.4
- **Description**: Configure SQLAlchemy to connect to local Postgres instance. Map table `document_chunks` inside `models.py` with columns `{ id, document_id, content, metadata, embedding }` using the `Vector` column type from `pgvector.sqlalchemy`.
- **Definition of Done**: Model file written; executing DB mapping helper script successfully creates database indices in PostgreSQL.

### Task 5.2: Create PDF Text Extraction Service
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 5.1
- **Description**: Implement `PDFExtractor` to extract text page-by-page from raw files and return standard text strings with basic layout normalization.
- **Definition of Done**: Unit test passes when extracting text from a sample 3-page technical PDF.

### Task 5.3: Implement Recursive Character Chunker
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 5.2
- **Description**: Write `DocumentChunker` using `RecursiveCharacterTextSplitter`. Ensure chunk metadata maps details like `page_number` and structural features.
- **Definition of Done**: Splitting test document outputs chunks within 800 character boundaries and retains overlap text.

### Task 5.4: Integrate all-MiniLM-L6-v2 Embedding Model
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 5.3
- **Description**: Implement `EmbeddingService` utilizing HuggingFace transformers (`sentence-transformers/all-MiniLM-L6-v2`) to transform input text chunks into 384-dimensional vector float lists.
- **Definition of Done**: Service converts sample strings into float vectors of length exactly 384.

### Task 5.5: Build pgvector Chunk Ingestion Repository
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: Tasks 5.1, 5.4
- **Description**: Build persistence logic inside `VectorStoreService` to insert generated chunks and vector arrays into `document_chunks` table within a single transaction session.
- **Definition of Done**: Method successfully inserts chunks and embeddings into PostgreSQL; checking database table rows counts verifies the persist.

### Task 5.6: Implement FastAPI Ingestion REST Endpoint
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Tasks 5.2 to 5.5
- **Description**: Create endpoint `POST /internal/v1/ingest` binding JSON parameters, processing files, and returning ingestion metrics.
- **Definition of Done**: Endpoint tested using Postman/curl; responds with HTTP 200 containing chunk counts and execution times.
