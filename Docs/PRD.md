# Product Requirements Document (PRD): Phoenix

**Project Name:** Phoenix — Transparent RAG for Technical Documentation  
**Status:** Implemented & Verified (Production Ready)  
**Document Version:** 1.1  

---

## 1. Executive Summary & Problem Statement

Generic Retrieval-Augmented Generation (RAG) pipelines often fail when applied to dense, precise technical documentation (such as Spring Boot configurations, API references, or AWS Architecture whitepapers). Two primary failure modes exist:

1. **Term Sensitivity**: Pure semantic vector search (e.g. cosine similarity on dense embeddings) frequently misses exact-match alphanumeric technical identifiers (e.g., configuration keys like `spring.jpa.hibernate.ddl-auto` or specific error codes) because the vector representation maps them to conceptually similar but technically incorrect contexts.
2. **The Black Box Problem**: Standard RAG interfaces display a generated answer with absolute confidence, hiding the system's internal retrieval uncertainty and self-correction efforts (such as query rewriting or context reranking) from the end-user.

**Phoenix** addresses these problems by implementing a high-accuracy **hybrid search** (Dense Vector + Sparse Keyword/BM25) and a **transparency-first user interface** that exposes fallback reasoning and composite confidence scores. The system prioritizes exact technical correctness over conversational extrapolation.

---

## 2. Target Persona & Use Case

### 2.1 Target Persona
* **Technical Reviewers / Recruiters / Software Engineers**: Personnel seeking precise answers from codebase specifications, configuration schemas, or developer guides without wading through manuals.

### 2.2 Core User Journey
1. A user creates an account (validating Username, Email, Password) and logs in.
2. The user creates a workspace (Project) and uploads a technical PDF (e.g. a Spring Boot reference manual).
3. The system splits the document into overlapping chunks, generates embeddings locally via `all-MiniLM-L6-v2`, and index vectors in `pgvector` alongside a `rank_bm25` vocabulary.
4. The user submits a specific technical query (e.g. "what is the default value of spring.datasource.url?").
5. The system performs a hybrid query and returns the answer alongside clickable citations, a retrieval confidence metric, and a collapsible reasoning timeline displaying the fallback pipeline status.

---

## 3. Functional Requirements (Implemented)

### 3.1 Python AI Engine (Core Logic)
* **Ingestion Pipeline**: Automated PDF extraction and cleaning. Text splitting is handled via `RecursiveCharacterTextSplitter` (chunk size: 800 chars, overlap: 150 chars) to maintain code block and key-value structure integrity.
* **Hybrid Retrieval**: Parallel execution of:
  * *Vector Search*: Cosine similarity computed against 384-dimensional dense vectors generated via `all-MiniLM-L6-v2` in `pgvector`.
  * *Keyword Search*: Exact-term frequency calculated dynamically via the BM25 Okapi algorithm.
* **WLC Fusion**: Score combination using a Weighted Linear Combination (WLC) formula with Min-Max normalization applied to BM25 scores.
* **Composite Confidence Scoring**: Calculates certainty based on top vector similarity (MaxSim) and Consensus Agreement (overlap between Vector top-3 and BM25 top-5).
* **Tiered Fallback System**:
  * *Green Path (CS >= 0.75)*: Generates the answer directly.
  * *Yellow Path (0.50 <= CS < 0.75)*: Rewrites the user query using an LLM and retries hybrid search.
  * *Orange Path (0.35 <= CS < 0.50)*: Gathers the top 20 fused candidates and reranks them via a `FlashRank` Cross-Encoder model.
  * *Red Path (CS < 0.35)*: Aborts generation and outputs a structured clarification question back to the user.

### 3.2 Spring Boot API Layer (Platform Orchestration)
* **Security**: Stateless JWT authentication.
  * *Registration fields*: Username, Email, Password, Confirm Password (enforces username uniqueness and password validation).
  * *Authentication fields*: Username or Email, Password.
* **User Identity**: The system consistently derives the user's primary identity from the registered `username` (rather than the email address) for profile displays, sidebar cards, and initials avatars.
* **Document and Project Management**: RESTful management of projects and files. Cascades physical storage cleanup and database row deletion on project removal.
* **Asynchronous Processing**: Background document indexing utilizing Spring's async TaskExecutor, communicating with the Python AI Engine over REST.

### 3.3 React Frontend (Client Console)
* **Document Vault**: File uploading interface featuring processing state alerts (e.g., `PROCESSING`, `READY`, `FAILED`).
* **Transparent Chat Interface**:
  * *Source Citations*: Monospace blocks displaying chunk page numbers, document source, and exact matches.
  * *Confidence Indicators*: HSL-derived color badges indicating the strength of the retrieval (Green/Yellow/Orange/Red).
  * *Reasoning Panel*: Collapsible execution timeline visualizing each step of the fallback orchestrator (e.g., initial confidence score, query rewrite string, reranking output, or clarification triggers).

---

## 4. Explicit Non-Goals
* **No Public Cloud Dependencies**: Designed strictly for local execution utilizing a local PostgreSQL instance and local LLM orchestration via Ollama to ensure complete data privacy and zero API costs.
* **No Multi-Document Cross-Referencing**: Retrieval context is bounded by a single uploaded document per query session.
* **File Type Limitation**: Exclusively supports PDF documents (no support for docx, txt, or raw html).
* **No Third-Party OAuth**: Authentication is handled purely through the internal JWT provider (no Google, GitHub, or Okta integrations).

---

## 5. Success Metrics
* **Hybrid Term-Matching Accuracy**: The system successfully retrieves alphanumeric configuration keys (e.g. `server.port`) that are completely missed by semantic-only vector searches.
* **Hallucination Prevention**: The system must transition to the clarification fallback state 100% of the time when queried on topics not covered in the document corpus, instead of generating false facts.
* **Explainability**: Reviewers can audit the exact path of the RAG pipeline from user input to LLM response through the UI Reasoning Trace.
