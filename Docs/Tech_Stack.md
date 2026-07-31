# Technology Stack & Rationale: Phoenix

This document specifies the software components, language runtimes, framework libraries, and local execution tools used to implement **Phoenix**, along with their design justifications.

---

## 1. Frontend Client Console (React)

The frontend is built as a single-page application (SPA) designed for fast Hot Module Replacement (HMR) and optimized build assets.

| Dependency / Tool | Version | Design Justification |
| :--- | :--- | :--- |
| **React** | `19.2` | Implements the client UI using the latest concurrent rendering optimizations for a responsive chat interface. |
| **Vite** | `8.1` | Selected over Create React App (CRA) to support instantaneous local dev server startups via native ES modules. |
| **Zustand** | `5.0` | Lightweight store-based state management that avoids the boilerplate of Redux while eliminating React Context re-render issues. |
| **Tailwind CSS** | `3.4` | Utility-first CSS framework enabling high layout density (essential for our diagnostic metrics and split-screen consoles). |
| **Framer Motion** | `12.4` | Animates the expandable "System Thought" panel to visually guide reviewers through the fallback state machine. |
| **react-markdown** | `10.1` | Safely parses and renders Markdown responses from the LLM, maintaining monospace styling for technical syntax blocks. |

---

## 2. API & Service Gateway (Spring Boot)

The Java API gateway orchestrates secure user access, files database transactions, and manages async task handoffs to the AI engine.

| Dependency / Library | Version | Design Justification |
| :--- | :--- | :--- |
| **Java JDK** | `21` | Utilizes modern language features (such as pattern matching and virtual thread compatibility) to ensure future-proof efficiency. |
| **Spring Boot** | `3.3.1` | Industry-standard framework for building robust REST services, dependency injection, and centralized configuration. |
| **Spring Security** | `6.3` | Enforces stateless request authorization filters checking JWT header validity. |
| **jjwt-api / impl** | `0.12.5` | Standardized library for building and parsing HMAC-SHA256 signed JSON Web Tokens. |
| **Spring Data JPA** | `3.3` | Simplifies persistence operations using Hibernate ORM to connect to the PostgreSQL instance. |
| **Flyway Core** | `10.15` | Version-controlled database migration framework that boots up schema migrations from `V1` to `V6` on startup. |

---

## 3. Python AI & Retrieval Engine (FastAPI)

The Python service isolates the text parsing, high-dimension embedding models, and local model inference logic.

| Dependency / Library | Version | Design Justification |
| :--- | :--- | :--- |
| **Python** | `3.11` | Ensures optimal support for deep learning frameworks (`PyTorch`, `sentence-transformers`) and async I/O loops. |
| **FastAPI** | `0.100` | High-performance, asynchronous web framework that generates automatic OpenAPI schemas. |
| **SQLAlchemy** | `2.0` | Python SQL Toolkit mapping ORM models (`DocumentChunk`) to execute SQL vector distance operators. |
| **pgvector** | `0.2` | Python library facilitating integration with PostgreSQL's vector operations. |
| **sentence-transformers**| `2.2` | Drives local execution of the `all-MiniLM-L6-v2` embedding model. |
| **rank_bm25** | `0.2` | Implements the BM25 Okapi model to retrieve document chunks matching exact alphanumeric technical tokens. |
| **flashrank** | `0.2` | Ultra-lightweight Cross-Encoder ranker used to perform CPU-bound re-ranking of fused query batches. |
| **pypdf** | `3.0` | Lightweight binary parser to extract raw text coordinates from uploaded documents. |

---

## 4. Local Infrastructure & Data Layer

Phoenix runs 100% locally to eliminate API subscription fees and ensure data privacy.

* **PostgreSQL 16**: Primary data repository. Holds users, projects, and documents metadata tables.
* **pgvector Extension**: Extends PostgreSQL to store 384-dimension float vectors and calculate cosine distance via database operators:
  * Uses the `<=>` operator (cosine distance) mapped as `(1.0 - (embedding <=> query_vector))` to compute Cosine Similarity in a single database query.
* **Docker Compose**: Wires up the PostgreSQL container on a local bridged network (`localhost:5432`).
* **Ollama (Inference)**: Run on the host system at `http://localhost:11434` loading the local `mistral` LLM, which keeps all inference compute completely local.

---

## 5. Architectural Trade-offs & Decisions

### 5.1 Local pgvector vs. Standalone Vector Database (Pinecone, Milvus)
1. **Zero Synced State Overhead**: Using `pgvector` allows document chunks and metadata rows to reside in the exact same database. Deleting a Project cascades physical file cleanups and database row removals in a single transaction.
2. **Simplified Infrastructure**: A standalone cloud database like Pinecone requires network authentication, data synchronization, and monthly costs. `pgvector` runs locally in Docker alongside PostgreSQL.

### 5.2 BM25 Okapi on-the-fly vs. Elasticsearch / Meilisearch
Since the application scope is defined as **single-document RAG queries**, building the BM25 keyword index on-the-fly from the database chunks of the active document (typically 10-150 chunks) is extremely fast (< 1.5ms) and eliminates the need to run, configure, and synchronize a separate Elasticsearch or Meilisearch container.

### 5.3 Ollama Local Host vs. OpenAI API
Using OpenAI's API exposes sensitive technical documents to external cloud APIs and incurs variable costs. Running Ollama locally with `mistral` provides consistent local execution, complete offline capability, and zero inference costs.
