# Product Requirements Document (PRD): Phoenix

**Project Name:** Phoenix — Transparent RAG for Technical Documentation  
**Status:** Planning / Architecture Phase  
**Document Version:** 1.0  

---

## 1. Problem Statement
Generic RAG (Retrieval-Augmented Generation) systems often fail when applied to dense technical documentation (e.g., Spring Boot, AWS Whitepapers). Two specific failure modes predominate:
1.  **Term Sensitivity:** Pure semantic vector search often misses exact-match technical identifiers (e.g., specific configuration keys like `spring.jpa.hibernate.ddl-auto` or error codes) in favor of conceptually similar but technically incorrect passages.
2.  **The Black Box Problem:** Users are presented with a confident answer but have no visibility into the system’s internal certainty or the "self-correction" steps taken when the initial retrieval was poor.

**Phoenix** addresses these gaps by implementing a **hybrid search** (Vector + Keyword/BM25) and a **transparency-first UI** that surfaces fallback reasoning and confidence scores, prioritizing technical accuracy over conversational fluency.

---

## 2. Target Persona & Use Case
*   **Target Persona:** Technical Reviewers and Recruiters.
*   **Core Use Case:** A user uploads a 50-page technical PDF (e.g., an AWS Architecture guide). They query the system for a specific implementation detail. Phoenix retrieves the source, calculates confidence, and—if the initial search is weak—demonstrates its ability to rewrite the query or ask a clarifying question rather than hallucinating an answer.

---

## 3. Functional Requirements (In-Scope)

### 3.1 Python AI Engine (Core Logic)
*   **Ingestion Pipeline:** Automated PDF parsing, recursive character chunking, and embedding generation.
*   **Hybrid Retrieval Engine:** Implementation of a dual-search pipeline combining:
    *   **Vector Search:** For semantic and conceptual matching.
    *   **Keyword Search (BM25):** For exact-match technical term retrieval.
*   **Vector Persistence:** Storage of embeddings in a vector database (Pinecone, pgvector, or FAISS).
*   **Confidence Scoring:** Each retrieval must produce a confidence metric based on similarity thresholds and keyword overlap.
*   **Fallback Logic Execution:** Triggering of specific strategies when confidence is low:
    *   **Query Rewriting:** Reformulating the user's prompt and retrying the search.
    *   **Re-ranking:** Re-evaluating the top-K retrieved chunks using a cross-encoder approach.
    *   **Clarification Generation:** Formulating a question back to the user when retrieval remains insufficient.

### 3.2 Spring Boot API Layer (Platform Orchestration)
*   **Security:** Implementation of stateless JWT authentication for user session management.
*   **Document Management:** REST endpoints for uploading PDF files and managing metadata (document status, chunk references).
*   **Metadata Persistence:** Storage of query history, document associations, and confidence logs in a relational database.
*   **AI Service Bridge:** A structured internal API contract to communicate with the Python AI engine over REST.

### 3.3 React Frontend (The Interface)
*   **Document Vault:** Interface for uploading and tracking the processing state of technical PDFs.
*   **Transparent Chat Interface:** A conversational UI that provides:
    *   **Source Citations:** Hyperlinked references to specific document chunks.
    *   **Confidence Indicators:** Visual representation of retrieval strength.
    *   **Reasoning Panel:** A dedicated "System Thought" view that explicitly shows *why* a fallback was triggered (e.g., "Confidence score 0.58 < 0.75; retrying with rewritten query").

---

## 4. Explicit Non-Goals
*   **No Infrastructure Deployment:** This project is for local/architecture demonstration; automated cloud deployment (AWS/Azure) is out of scope.
*   **No Multi-Document Cross-Referencing:** Initial scope is limited to RAG over a single project/document context at a time.
*   **Limited File Support:** Support is strictly for PDF files; no support for .txt, .docx, or .html.
*   **Basic Auth Only:** No OAuth2 (Google/GitHub) or complex RBAC (Role-Based Access Control) beyond basic user identification.

---

## 5. Success Criteria
*   **Hybrid Superiority:** In benchmarking, the system must successfully retrieve exact-match technical keys (e.g., `server.port`) that are missed by a pure vector-search baseline.
*   **Graceful Uncertainty:** The system must trigger a "Clarification" or "Query Rewrite" fallback 100% of the time when queried about topics not present in the uploaded document, rather than hallucinating.
*   **Auditability:** A technical reviewer must be able to follow the logic path from "User Query" to "Confidence Score" to "Fallback Strategy" via the UI.

---

## 6. Key Risks & Open Questions
*   **Chunk Size Optimization:** Finding the balance between code-block integrity and embedding model context limits.
*   **Confidence Calibration:** Defining the mathematical threshold at which "Vector + BM25" is considered "low confidence."
*   **Latency:** The overhead of running query rewriting and re-ranking may increase response times; needs monitoring.
