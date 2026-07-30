# System Feature Specification: Phoenix

This document defines the functional capabilities implemented in the **Phoenix** architecture, structured by system layer and service boundaries.

---

## 1. Spring Boot API Layer (Java Platform)

The Spring Boot backend serves as the database orchestrator, security gatekeeper, and asynchronous bridge to the Python AI Engine.

* **Stateless JWT Security**:
  * *Registration Flow*: Validates `Username`, `Email`, `Password`, and `Confirm Password` before creation. Password is encrypted using `BCryptPasswordEncoder` (12 rounds).
  * *Login Flow*: Resolves credentials through `findByEmailOrUsername` mapping. Issues a stateless JWT signed with a HS256 key.
* **Username-First User Identity**:
  * Extends standard Spring Security `UserDetails` where the primary identifier (`getUsername()`) returns the unique `username`.
  * Profile widgets, avatars, and sidebar headers derive initials and display text exclusively from the registered `username`.
* **Workspace & Project Management**:
  * Project creation, retrieval, and cascading deletion.
  * *Cascading Deletion*: Deleting a project triggers a database transaction that deletes all project metadata, cascaded document rows, and physical files stored in the local upload folder, simultaneously triggering cleaning of the Python AI engine's vector tables.
* **Document Upload & Storage Handler**:
  * Handles multipart PDF uploads via `POST /api/documents/upload`.
  * Persists document records to PostgreSQL with states (`PROCESSING` -> `READY` or `FAILED`).
  * Stores files in the local filesystem storage path (`backend/storage`).
* **Asynchronous AI Engine Handoff**:
  * Invokes the Python AI engine's `/internal/v1/ingest` asynchronously using Spring's task execution thread pool.
  * Polls ingestion status to update database state without blocking thread context.

---

## 2. Python AI Engine (AI & Retrieval Layer)

The FastAPI engine hosts the heavy embedding computations, vector searches, reciprocal keyword scores, and LLM interfaces.

* **Intelligent Document Ingestion**:
  * Extracts PDF content and slices text using a `RecursiveCharacterTextSplitter` (chunk size: 800, overlap: 150) preserving structure.
  * Embeds text chunks via `SentenceTransformer("all-MiniLM-L6-v2")` to generate 384-dimensional dense vectors.
  * Populates SQL tables in PostgreSQL using SQLAlchemy models mapping `pgvector` types.
* **Dual-Engine Hybrid Search**:
  * *Vector Search*: Cosine similarity computed against candidate chunks using PostgreSQL `pgvector` distance operator (`<=>`).
  * *Keyword Search*: Custom English tokenizer (whitespace, lowercase, stop-word removal) feeding a dynamic `rank_bm25` Okapi index computed for the requested document.
* **Weighted Linear Combination (WLC) Fusion**:
  * Normalizes keyword scores using Min-Max scaling per query batch.
  * Blends scores: $Score = 0.7 \cdot VectorSim + 0.3 \cdot BM25_{norm}$.
* **Tiered Fallback State Machine**:
  * Calculates composite confidence score: $0.6 \cdot MaxSim + 0.4 \cdot Agreement$.
  * Executes query expansion rewriting, FlashRank reranking (`ms-marco-MiniLM-L-6-v2`), or politely formats clarification queries back to the client console to prevent model hallucinations.
* **Monospace Trace Logging**:
  * Builds a chronological trace containing `ReasoningStepDto` lists mapping states, confidence thresholds, and system decisions.

---

## 3. React Frontend Client

The frontend client operates as a dense developer workspace console optimized for quick search auditing.

* **Document Vault**:
  * Allows PDF uploads and tracks processing states (`PROCESSING`, `READY`, `FAILED`) dynamically.
* **Auditable Chat Console**:
  * Renders markdown-based LLM answers using `react-markdown` with syntax highlighting for code blocks.
  * *Source Citation Panels*: Interactive citation buttons displaying document title, page numbers, relevance match scores, and source text snippets.
  * *System Thoughts Toggle*: Collapsible execution timeline visualizing the Python fallback trace (showing scoring details, query rewriting text, and reranking logs).
  * *Dynamic Avatars*: Automatically formats two-letter initials derived directly from the registered `username`.
